import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchEntity } from '../entities/match.entity';

@Injectable()
export class GetMatchesUseCase {
  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
  ) {}

  async execute(page = 1, limit = 10) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const [matches, total] = await this.matchRepo.findAndCount({
      relations: ['players', 'players.player'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    const data = matches.map((m) => ({
      id: m.id,
      externalId: m.externalId,
      createdAt: m.createdAt,
      players: (m.players || []).map((mp) => ({
        name: mp.player?.name ?? 'UNKNOWN',
        kills: mp.kills,
        deaths: mp.deaths,
      })),
    }));

    return {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
      data,
    };
  }
}
