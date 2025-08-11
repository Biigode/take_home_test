import { Repository } from 'typeorm';
import { MatchEntity } from '../entities/match.entity';
import { GetMatchesUseCase } from './getMatches.usecase';

describe('GetMatchesUseCase', () => {
  let useCase: GetMatchesUseCase;
  let matchRepo: Pick<Repository<MatchEntity>, 'findAndCount'>;

  beforeEach(() => {
    matchRepo = { findAndCount: jest.fn() } as Pick<
      Repository<MatchEntity>,
      'findAndCount'
    >;
    useCase = new GetMatchesUseCase(matchRepo as Repository<MatchEntity>);
  });

  it('should return paginated matches with mapped data', async () => {
    const fakeMatches: MatchEntity[] = [
      {
        id: '1',
        externalId: 'ext-1',
        createdAt: new Date('2023-01-01'),
        kills: [],
        players: [
          {
            player: {
              id: 'p1',
              name: 'Player 1',
              matchPlayers: [],
              kills: [],
              deaths: [],
            },
            kills: 2,
            deaths: 1,
            id: 'mp1',
            match: { id: '1' } as MatchEntity,
          },
          {
            player: {
              id: 'p2',
              name: 'Player 2',
              matchPlayers: [],
              kills: [],
              deaths: [],
            },
            kills: 0,
            deaths: 3,
            id: 'mp2',
            match: undefined,
          },
        ],
      } as MatchEntity,
      {
        id: '2',
        externalId: 'ext-2',
        createdAt: new Date('2023-01-02'),
        kills: [],
        players: [
          {
            player: {
              id: 'p3',
              name: 'Player 3',
              matchPlayers: [],
              kills: [],
              deaths: [],
            },
            kills: 5,
            deaths: 0,
            id: 'mp3',
            match: { id: '2' } as MatchEntity,
          },
        ],
      } as MatchEntity,
    ];
    (matchRepo.findAndCount as jest.Mock).mockResolvedValue([fakeMatches, 2]);

    const result = await useCase.execute(1, 10);

    expect(matchRepo.findAndCount).toHaveBeenCalledWith({
      relations: ['players', 'players.player'],
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 10,
    });
    expect(result).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      data: [
        {
          id: '1',
          externalId: 'ext-1',
          createdAt: new Date('2023-01-01'),
          players: [
            { name: 'Player 1', kills: 2, deaths: 1 },
            { name: 'Player 2', kills: 0, deaths: 3 },
          ],
        },
        {
          id: '2',
          externalId: 'ext-2',
          createdAt: new Date('2023-01-02'),
          players: [{ name: 'Player 3', kills: 5, deaths: 0 }],
        },
      ],
    });
  });

  it('should limit the take to 100 if limit is greater', async () => {
    (matchRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);
    await useCase.execute(1, 150);
    expect(matchRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });
});
