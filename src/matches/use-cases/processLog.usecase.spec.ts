import { Repository } from 'typeorm';
import { KillEntity } from '../entities/kill.entity';
import { MatchPlayerEntity } from '../entities/match-player.entity';
import { MatchEntity } from '../entities/match.entity';
import { PlayerEntity } from '../entities/player.entity';
import { ProcessLogUseCase } from './processLog.usecase';

describe('ProcessLogUseCase', () => {
  let useCase: ProcessLogUseCase;
  let matchRepository: jest.Mocked<Repository<MatchEntity>>;
  let playerRepository: jest.Mocked<Repository<PlayerEntity>>;
  let killRepository: jest.Mocked<Repository<KillEntity>>;
  let matchPlayerRepository: jest.Mocked<Repository<MatchPlayerEntity>>;
  let transactionFn: jest.Mock;

  beforeEach(() => {
    matchRepository = {
      manager: {
        transaction: jest.fn(),
      },
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      getRepository: jest.fn(),
    } as unknown as jest.Mocked<Repository<MatchEntity>>;
    playerRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      getRepository: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlayerEntity>>;
    killRepository = {
      create: jest.fn(),
      save: jest.fn(),
      getRepository: jest.fn(),
    } as unknown as jest.Mocked<Repository<KillEntity>>;
    matchPlayerRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      getRepository: jest.fn(),
    } as unknown as jest.Mocked<Repository<MatchPlayerEntity>>;

    transactionFn = jest.fn(
      async (
        cb: (manager: {
          getRepository: (
            entity: import('typeorm').EntityTarget<any>,
          ) => jest.Mocked<Repository<any>>;
        }) => any,
      ) => {
        const manager = {
          getRepository: (
            entity: import('typeorm').EntityTarget<any>,
          ): jest.Mocked<Repository<any>> => {
            if (entity === MatchEntity) return matchRepository;
            if (entity === PlayerEntity) return playerRepository;
            if (entity === KillEntity) return killRepository;
            if (entity === MatchPlayerEntity) return matchPlayerRepository;
            throw new Error('Unknown entity');
          },
        };
        return cb(manager);
      },
    );
    (matchRepository.manager.transaction as any) = transactionFn;

    useCase = new ProcessLogUseCase(
      matchRepository as any,
      playerRepository as any,
      killRepository as any,
      matchPlayerRepository as any,
    );
  });

  it('should parse a log and create a match with players and kills', async () => {
    const log = [
      'New match 1 has started',
      '23:06 - Roman killed Nick using M16',
      '23:07 - Nick killed Roman using AK47',
      'Match 1 has ended',
    ].join('\n');

    const match = {
      id: 'm1',
      externalId: '1',
      players: [],
      kills: [],
      createdAt: new Date(),
    } as MatchEntity;
    matchRepository.create.mockReturnValue(match);
    matchRepository.save.mockResolvedValue(match);

    playerRepository.findOne.mockResolvedValueOnce(null);
    playerRepository.create.mockReturnValueOnce({
      id: 'p1',
      name: 'Roman',
    } as PlayerEntity);
    playerRepository.save.mockResolvedValueOnce({
      id: 'p1',
      name: 'Roman',
    } as PlayerEntity);
    playerRepository.findOne.mockResolvedValueOnce(null);
    playerRepository.create.mockReturnValueOnce({
      id: 'p2',
      name: 'Nick',
    } as PlayerEntity);
    playerRepository.save.mockResolvedValueOnce({
      id: 'p2',
      name: 'Nick',
    } as PlayerEntity);

    matchPlayerRepository.find.mockResolvedValue([]);
    matchPlayerRepository.findOne.mockResolvedValue(null);
    matchPlayerRepository.create.mockReturnValue({
      kills: 0,
      deaths: 0,
    } as any);
    matchPlayerRepository.save.mockResolvedValue({} as any);

    killRepository.create.mockReturnValue({} as KillEntity);
    killRepository.save.mockResolvedValue({} as KillEntity);

    const result = await useCase.execute(log);
    expect(result.length).toBe(1);
    expect(matchRepository.create).toHaveBeenCalled();
    expect(playerRepository.create).toHaveBeenCalled();
    expect(killRepository.create).toHaveBeenCalled();
  });

  it('should throw error if more than 20 unique players in a match', async () => {
    const players = Array.from({ length: 21 }, (_, i) => `Player${i + 1}`);
    const logLines = [
      'New match 2 has started',
      ...players.map((p) => `23:00 - ${p} killed Nick using AK47`),
      'Match 2 has ended',
    ];
    const log = logLines.join('\n');

    matchPlayerRepository.find.mockImplementation(() => {
      const arr: MatchPlayerEntity[] = Array.from({ length: 20 }, (_, i) => ({
        id: `mp${i + 1}`,
        match: {} as MatchEntity,
        player: { id: `p${i + 1}`, name: `Player${i + 1}` } as PlayerEntity,
        kills: 0,
        deaths: 0,
      }));
      return Promise.resolve(arr);
    });

    matchPlayerRepository.findOne.mockImplementation(() =>
      Promise.resolve(null),
    );
    playerRepository.findOne.mockImplementation(() => Promise.resolve(null));
    playerRepository.create.mockImplementation(
      ({ name }) => ({ id: name, name }) as PlayerEntity,
    );
    playerRepository.save.mockImplementation(
      async (p) => ({ id: (p as any).id || 'pid', ...p }) as PlayerEntity,
    );
    matchPlayerRepository.create.mockReturnValue({
      kills: 0,
      deaths: 0,
    } as any);
    matchPlayerRepository.save.mockResolvedValue({} as any);
    killRepository.create.mockReturnValue({} as KillEntity);
    killRepository.save.mockResolvedValue({} as KillEntity);

    const match2 = {
      id: 'm2',
      externalId: '2',
      players: [],
      kills: [],
      createdAt: new Date(),
    } as MatchEntity;
    matchRepository.create.mockReturnValue(match2);
    matchRepository.save.mockResolvedValue(match2);

    await expect(useCase.execute(log)).rejects.toThrow(
      'Não é permitido mais que 20 jogadores em uma partida.',
    );
  });
  it('should handle <WORLD> kills and not create a killer player', async () => {
    const log = [
      'New match 3 has started',
      '23:10 - <WORLD> killed Nick by DROWN',
      'Match 3 has ended',
    ].join('\n');

    const match3 = {
      id: 'm3',
      externalId: '3',
      players: [],
      kills: [],
      createdAt: new Date(),
    } as MatchEntity;
    matchRepository.create.mockReturnValue(match3);
    matchRepository.save.mockResolvedValue(match3);

    matchPlayerRepository.find.mockResolvedValue([]);
    matchPlayerRepository.findOne.mockResolvedValue(null);
    matchPlayerRepository.create.mockReturnValue({
      kills: 0,
      deaths: 0,
    } as any);
    matchPlayerRepository.save.mockResolvedValue({} as any);

    playerRepository.findOne.mockResolvedValue(null);
    playerRepository.create.mockReturnValue({
      id: 'p3',
      name: 'Nick',
    } as PlayerEntity);
    playerRepository.save.mockResolvedValue({
      id: 'p3',
      name: 'Nick',
    } as PlayerEntity);

    const result = await useCase.execute(log);
    expect(result.length).toBe(1);
    expect(playerRepository.create).toHaveBeenCalledWith({ name: 'Nick' });
    expect(playerRepository.create).not.toHaveBeenCalledWith({
      id: expect.anything(),
      name: '<WORLD>',
    });
  });

  it('should throw error on duplicate match externalId (code 23505)', async () => {
    const log = ['New match 4 has started', 'Match 4 has ended'].join('\n');

    transactionFn.mockRejectedValueOnce({ code: '23505' });

    await expect(useCase.execute(log)).rejects.toThrow(
      'Já existe um registro com o mesmo externalId.',
    );
  });

  it('should propagate unknown errors', async () => {
    const log = ['New match 5 has started', 'Match 5 has ended'].join('\n');

    transactionFn.mockRejectedValueOnce(new Error('Unknown error'));
    await expect(useCase.execute(log)).rejects.toThrow('Unknown error');
  });
});
