import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KillEntity } from '../entities/kill.entity';
import { MatchPlayerEntity } from '../entities/match-player.entity';
import { MatchEntity } from '../entities/match.entity';
import { PlayerEntity } from '../entities/player.entity';

@Injectable()
export class ProcessLogUseCase {
  constructor(
    @InjectRepository(MatchEntity)
    private matchRepository: Repository<MatchEntity>,

    @InjectRepository(PlayerEntity)
    private playerRepository: Repository<PlayerEntity>,

    @InjectRepository(KillEntity)
    private killRepository: Repository<KillEntity>,

    @InjectRepository(MatchPlayerEntity)
    private matchPlayerRepository: Repository<MatchPlayerEntity>,
  ) {}

  async execute(logContent: string): Promise<MatchEntity[]> {
    try {
      return await this.matchRepository.manager.transaction(async (manager) => {
        const lines = logContent
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        const matches: MatchEntity[] = [];
        let currentMatch: MatchEntity | null = null;

        const matchRepository = manager.getRepository(MatchEntity);
        const playerRepository = manager.getRepository(PlayerEntity);
        const killRepository = manager.getRepository(KillEntity);
        const matchPlayerRepository = manager.getRepository(MatchPlayerEntity);

        for (const line of lines) {
          if (line.includes('New match')) {
            const matchId = line.match(/New match (\d+) has started/)?.[1];
            if (matchId) {
              currentMatch = matchRepository.create({
                externalId: matchId,
                players: [],
                kills: [],
                createdAt: new Date(),
              });
              await matchRepository.save(currentMatch);
            }
          } else if (line.includes('killed') && line.includes('using')) {
            const killRegex = / - (.+) killed (.+) using (.+)/;
            const [, killerName, victimName, weapon] =
              line.match(killRegex) || [];

            if (currentMatch && killerName && victimName && weapon) {
              let killer: PlayerEntity | null = null;
              if (killerName !== '<WORLD>') {
                killer = await playerRepository.findOne({
                  where: { name: killerName },
                });
                if (!killer) {
                  killer = playerRepository.create({ name: killerName });
                  await playerRepository.save(killer);
                }
              }

              let victim = await playerRepository.findOne({
                where: { name: victimName },
              });
              if (!victim) {
                victim = playerRepository.create({ name: victimName });
                await playerRepository.save(victim);
              }

              if (killer) {
                let killerMatchPlayer = await matchPlayerRepository.findOne({
                  where: { match: currentMatch, player: killer },
                });
                if (!killerMatchPlayer) {
                  killerMatchPlayer = matchPlayerRepository.create({
                    match: currentMatch,
                    player: killer,
                    kills: 0,
                    deaths: 0,
                  });
                }
                killerMatchPlayer.kills += 1;
                await matchPlayerRepository.save(killerMatchPlayer);
              }

              let victimMatchPlayer = await matchPlayerRepository.findOne({
                where: { match: currentMatch, player: victim },
              });
              if (!victimMatchPlayer) {
                victimMatchPlayer = matchPlayerRepository.create({
                  match: currentMatch,
                  player: victim,
                  kills: 0,
                  deaths: 0,
                });
              }
              victimMatchPlayer.deaths += 1;
              await matchPlayerRepository.save(victimMatchPlayer);

              const kill = killRepository.create({
                match: currentMatch,
                killer,
                victim,
                weapon,
                timestamp: new Date(),
              });
              await killRepository.save(kill);
            }
          } else if (line.includes('<WORLD> killed') && line.includes('by')) {
            const worldKillRegex = / - <WORLD> killed (.+) by (.+)/;
            const [, victimName] = line.match(worldKillRegex) || [];
            if (currentMatch && victimName) {
              let victim = await playerRepository.findOne({
                where: { name: victimName },
              });
              if (!victim) {
                victim = playerRepository.create({ name: victimName });
                await playerRepository.save(victim);
              }

              let victimMatchPlayer = await matchPlayerRepository.findOne({
                where: { match: currentMatch, player: victim },
              });
              if (!victimMatchPlayer) {
                victimMatchPlayer = matchPlayerRepository.create({
                  match: currentMatch,
                  player: victim,
                  kills: 0,
                  deaths: 0,
                });
              }
              victimMatchPlayer.deaths += 1;
              await matchPlayerRepository.save(victimMatchPlayer);
            }
          } else if (line.includes('Match') && line.includes('has ended')) {
            if (currentMatch) {
              matches.push(currentMatch);
              currentMatch = null;
            }
          }
        }

        return matches;
      });
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error && error.code === '23505') {
        throw new Error('Já existe um registro com o mesmo externalId.');
      }
      throw error;
    }
  }
}
