import { Repository } from 'typeorm';
import { MatchPlayerEntity } from '../entities/match-player.entity';
import { MatchEntity } from '../entities/match.entity';
import { GetRankingUseCase } from './getRanking.usecase';

describe('GetRankingUseCase', () => {
  let useCase: GetRankingUseCase;
  let matchRepository: jest.Mocked<Pick<Repository<MatchEntity>, 'findOne'>>;
  let matchPlayerRepository: jest.Mocked<
    Pick<Repository<MatchPlayerEntity>, 'find'>
  >;

  beforeEach(() => {
    matchRepository = { findOne: jest.fn() };
    matchPlayerRepository = { find: jest.fn() };
    useCase = new GetRankingUseCase(
      matchRepository as unknown as Repository<MatchEntity>,
      matchPlayerRepository as unknown as Repository<MatchPlayerEntity>,
    );
  });

  it('should return ranking sorted by kills desc and deaths asc', async () => {
    const match: MatchEntity = { id: '1', externalId: 'ext-1' } as MatchEntity;
    matchRepository.findOne.mockResolvedValue(match);

    const playerMock = (name: string) => ({
      id: name.toLowerCase().replace(' ', ''),
      name,
      matchPlayers: [],
      kills: [],
      deaths: [],
    });

    const players: MatchPlayerEntity[] = [
      {
        id: 'mp1',
        player: playerMock('Player 1'),
        kills: 5,
        deaths: 2,
        match: match,
      } as MatchPlayerEntity,
      {
        id: 'mp2',
        player: playerMock('Player 2'),
        kills: 5,
        deaths: 1,
        match: match,
      } as MatchPlayerEntity,
      {
        id: 'mp3',
        player: playerMock('Player 3'),
        kills: 2,
        deaths: 0,
        match: match,
      } as MatchPlayerEntity,
    ];
    matchPlayerRepository.find.mockResolvedValue(players);

    const result = await useCase.execute('ext-1');

    expect(matchRepository.findOne).toHaveBeenCalledWith({
      where: { externalId: 'ext-1' },
    });
    expect(matchPlayerRepository.find).toHaveBeenCalledWith({
      where: { match },
      relations: ['player'],
    });
    expect(result).toEqual({
      matchId: 'ext-1',
      players: [
        { name: 'Player 2', kills: 5, deaths: 1, killDeathRatio: 5 },
        { name: 'Player 1', kills: 5, deaths: 2, killDeathRatio: 2.5 },
        { name: 'Player 3', kills: 2, deaths: 0, killDeathRatio: 2 },
      ],
    });
  });

  it('should throw if match is not found', async () => {
    matchRepository.findOne.mockResolvedValue(null);
    await expect(useCase.execute('notfound')).rejects.toThrow(
      'Match notfound not found',
    );
  });
});
