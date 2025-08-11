import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchPlayerEntity } from '../entities/match-player.entity';
import { MatchEntity } from '../entities/match.entity';

@Injectable()
export class GetRankingUseCase {
  constructor(
    @InjectRepository(MatchEntity)
    private matchRepository: Repository<MatchEntity>,

    @InjectRepository(MatchPlayerEntity)
    private matchPlayerRepository: Repository<MatchPlayerEntity>,
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

    return {
      matchId: match.externalId,
      players: playersDto,
    };
  }
}
