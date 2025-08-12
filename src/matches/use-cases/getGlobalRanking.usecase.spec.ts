import { Repository } from 'typeorm';
import { MatchPlayerEntity } from '../entities/match-player.entity';
import { PlayerEntity } from '../entities/player.entity';
import { GetGlobalRankingUseCase } from './getGlobalRanking.usecase';

describe('GetGlobalRankingUseCase', () => {
  let useCase: GetGlobalRankingUseCase;
  let playerRepository: { find: jest.Mock };
  let matchPlayerRepository: { find: jest.Mock };

  beforeEach(() => {
    playerRepository = {
      find: jest.fn(),
    };
    matchPlayerRepository = {
      find: jest.fn(),
    };
    useCase = new GetGlobalRankingUseCase(
      playerRepository as unknown as Repository<PlayerEntity>,
      matchPlayerRepository as unknown as Repository<MatchPlayerEntity>,
    );
  });

  it('should return empty ranking if there are no players', async () => {
    playerRepository.find.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });

  it('should correctly calculate kills, deaths, matches and killDeathRatio', async () => {
    const player1 = { name: 'Player1', matchPlayers: [{}] } as PlayerEntity;
    const player2 = { name: 'Player2', matchPlayers: [{}] } as PlayerEntity;
    playerRepository.find.mockResolvedValue([player1, player2]);
    matchPlayerRepository.find
      .mockResolvedValueOnce([
        { kills: 10, deaths: 2 },
        { kills: 5, deaths: 1 },
      ])
      .mockResolvedValueOnce([
        { kills: 3, deaths: 0 },
        { kills: 2, deaths: 0 },
      ]);

    const result = await useCase.execute();
    expect(result).toEqual([
      {
        name: 'Player1',
        kills: 15,
        deaths: 3,
        matches: 2,
        killDeathRatio: +(15 / 3).toFixed(2),
      },
      {
        name: 'Player2',
        kills: 5,
        deaths: 0,
        matches: 2,
        killDeathRatio: 5,
      },
    ]);
  });

  it('should sort by kills descending and deaths ascending', async () => {
    const player1 = { name: 'A', matchPlayers: [{}] } as PlayerEntity;
    const player2 = { name: 'B', matchPlayers: [{}] } as PlayerEntity;
    playerRepository.find.mockResolvedValue([player1, player2]);
    matchPlayerRepository.find
      .mockResolvedValueOnce([{ kills: 5, deaths: 2 }])
      .mockResolvedValueOnce([{ kills: 5, deaths: 1 }]);
    const result = await useCase.execute();
    expect(result[0].name).toBe('B');
    expect(result[1].name).toBe('A');
  });

  it('should handle player with no deaths (deaths = 0)', async () => {
    const player = { name: 'NoDeath', matchPlayers: [{}] } as PlayerEntity;
    playerRepository.find.mockResolvedValue([player]);
    matchPlayerRepository.find.mockResolvedValue([{ kills: 7, deaths: 0 }]);
    const result = await useCase.execute();
    expect(result[0].killDeathRatio).toBe(7);
  });
});
