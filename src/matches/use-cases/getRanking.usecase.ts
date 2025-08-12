import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KillEntity } from '../entities/kill.entity';
import { MatchPlayerEntity } from '../entities/match-player.entity';
import { MatchEntity } from '../entities/match.entity';

@Injectable()
export class GetRankingUseCase {
  constructor(
    @InjectRepository(MatchEntity)
    private matchRepository: Repository<MatchEntity>,

    @InjectRepository(MatchPlayerEntity)
    private matchPlayerRepository: Repository<MatchPlayerEntity>,
    @InjectRepository(KillEntity)
    private killRepository: Repository<KillEntity>,
  ) {}

  async execute(matchId: string) {
    const match = await this.matchRepository.findOne({
      where: { externalId: matchId },
    });
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    const players = await this.matchPlayerRepository.find({
      where: { match: match },
      relations: ['player'],
    });

    const playersDto = players.map((mp) => {
      const kills = mp.kills || 0;
      const deaths = mp.deaths || 0;
      const ratio = deaths === 0 ? kills : +(kills / deaths).toFixed(2);

      return {
        name: mp.player.name,
        kills,
        deaths,
        killDeathRatio: ratio,
      };
    });

    playersDto.sort((a, b) => {
      if (b.kills === a.kills) {
        return a.deaths - b.deaths;
      }
      return b.kills - a.kills;
    });

    const winner = playersDto[0];
    let favoriteWeapon: string | null = null;
    if (winner) {
      const winnerKills = await this.killRepository.find({
        where: {
          match: match,
          killer: { name: winner.name },
        },
        relations: ['killer'],
      });

      const weaponCount: Record<string, number> = {};
      for (const kill of winnerKills) {
        if (kill.weapon) {
          weaponCount[kill.weapon] = (weaponCount[kill.weapon] || 0) + 1;
        }
      }

      favoriteWeapon =
        Object.entries(weaponCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    }


    const allKills = await this.killRepository.find({
      where: { match: match },
      relations: ['killer', 'victim'],
      order: { timestamp: 'ASC' },
    });


    const streaks: Record<string, number> = {};
    const currentStreak: Record<string, number> = {};
    const deaths: Record<string, number> = {};
    for (const kill of allKills) {
      const killer = kill.killer?.name;
      const victim = kill.victim?.name;
      if (killer && killer !== '<WORLD>') {
        currentStreak[killer] = (currentStreak[killer] || 0) + 1;
        if (!streaks[killer] || currentStreak[killer] > streaks[killer]) {
          streaks[killer] = currentStreak[killer];
        }
      }
      if (victim) {
        currentStreak[victim] = 0;
        deaths[victim] = (deaths[victim] || 0) + 1;
      }
    }

    let bestStreakPlayer: string | null = null;
    let bestStreak = 0;
    for (const [player, streak] of Object.entries(streaks)) {
      if (streak > bestStreak) {
        bestStreak = streak;
        bestStreakPlayer = player;
      }
    }

    let winnerNoDeathAward = false;
    if (winner && deaths[winner.name] === undefined) {
      winnerNoDeathAward = true;
    }

    const killsByPlayer: Record<string, KillEntity[]> = {};
    for (const kill of allKills) {
      const killer = kill.killer?.name;
      if (killer && killer !== '<WORLD>') {
        if (!killsByPlayer[killer]) killsByPlayer[killer] = [];
        killsByPlayer[killer].push(kill);
      }
    }
    const award5Kills1Min: string[] = [];
    for (const [player, kills] of Object.entries(killsByPlayer)) {
      kills.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      for (let i = 0; i <= kills.length - 5; i++) {
        const t0 = kills[i].timestamp.getTime();
        const t4 = kills[i + 4].timestamp.getTime();
        if (t4 - t0 <= 60 * 1000) {
          award5Kills1Min.push(player);
          break;
        }
      }
    }

    return {
      matchId: match.externalId,
      players: playersDto,
      favoriteWeaponWinner: favoriteWeapon,
      bestStreakPlayer,
      bestStreak,
      winnerNoDeathAward,
      award5Kills1Min,
    };
  }
}
