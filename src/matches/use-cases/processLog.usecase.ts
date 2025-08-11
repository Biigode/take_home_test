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

        const patterns: {
          regex: RegExp;
          handler: (line: string) => void | Promise<void>;
        }[] = [
          {
            regex: /New match \d+ has started/,
            handler: (line) => this.handleNewMatch(line, matchRepository),
          },
          {
            regex: / - .+ killed .+ using .+/,
            handler: (line) =>
              this.handleKill(
                line,
                playerRepository,
                matchPlayerRepository,
                killRepository,
                () => currentMatch,
              ),
          },
          {
            regex: / - <WORLD> killed .+ by .+/,
            handler: (line) =>
              this.handleWorldKill(
                line,
                playerRepository,
                matchPlayerRepository,
                () => currentMatch,
              ),
          },
          {
            regex: /Match \d+ has ended/,
            handler: () => {
              if (currentMatch) {
                matches.push(currentMatch);
                currentMatch = null;
              }
            },
          },
        ];

        for (const line of lines) {
          const matched = patterns.find((p) => p.regex.test(line));
          if (matched) {
            await matched.handler(line);
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

  private async handleNewMatch(
    line: string,
    matchRepository: Repository<MatchEntity>,
  ) {
    const matchId = line.match(/New match (\d+) has started/)?.[1];
    if (matchId) {
      const match = matchRepository.create({
        externalId: matchId,
        players: [],
        kills: [],
        createdAt: new Date(),
      });
      await matchRepository.save(match);
    }
  }

  private async handleKill(
    line: string,
    playerRepository: Repository<PlayerEntity>,
    matchPlayerRepository: Repository<MatchPlayerEntity>,
    killRepository: Repository<KillEntity>,
    getCurrent: () => MatchEntity | null,
  ) {
    const killRegex = / - (.+) killed (.+) using (.+)/;
    const [, killerName, victimName, weapon] = line.match(killRegex) || [];
    const currentMatch = getCurrent();
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
  }

  private async handleWorldKill(
    line: string,
    playerRepository: Repository<PlayerEntity>,
    matchPlayerRepository: Repository<MatchPlayerEntity>,
    getCurrent: () => MatchEntity | null,
  ) {
    const worldKillRegex = / - <WORLD> killed (.+) by (.+)/;
    const [, victimName] = line.match(worldKillRegex) || [];
    const currentMatch = getCurrent();
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
  }
}
