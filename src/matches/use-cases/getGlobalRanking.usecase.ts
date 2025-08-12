import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchPlayerEntity } from '../entities/match-player.entity';
import { PlayerEntity } from '../entities/player.entity';

@Injectable()
export class GetGlobalRankingUseCase {
  constructor(
    @InjectRepository(PlayerEntity)
    private playerRepository: Repository<PlayerEntity>,
    @InjectRepository(MatchPlayerEntity)
    private matchPlayerRepository: Repository<MatchPlayerEntity>,
  ) {}

  async execute() {
    const players = await this.playerRepository.find({
      relations: ['matchPlayers'],
    });
    type PlayerRanking = {
      name: string;
      kills: number;
      deaths: number;
      matches: number;
      killDeathRatio: number;
    };
    const ranking: PlayerRanking[] = [];
    for (const player of players) {
      const stats = await this.matchPlayerRepository.find({
        where: { player },
      });
      const kills = stats.reduce((acc, mp) => acc + (mp.kills || 0), 0);
      const deaths = stats.reduce((acc, mp) => acc + (mp.deaths || 0), 0);
      const matches = stats.length;
      const ratio = deaths === 0 ? kills : +(kills / deaths).toFixed(2);
      ranking.push({
        name: player.name,
        kills,
        deaths,
        matches,
        killDeathRatio: ratio,
      });
    }
    ranking.sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
    return ranking;
  }
}
