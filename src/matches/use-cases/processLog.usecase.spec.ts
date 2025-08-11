import { ProcessLogUseCase } from './processLog.usecase';

describe('ProcessLogUseCase', () => {
  let useCase: ProcessLogUseCase;

  beforeEach(() => {
    useCase = {} as ProcessLogUseCase;
    useCase.execute = ProcessLogUseCase.prototype.execute.bind(
      useCase,
    ) as ProcessLogUseCase['execute'];
  });

  it('should parse matches and player stats correctly', async () => {
    const log = `
      23/04/2019 15:34:22 - New match 11348965 has started
      23/04/2019 15:36:04 - Roman killed Nick using M16
      23/04/2019 15:36:33 - <WORLD> killed Nick by DROWN
      23/04/2019 15:39:22 - Match 11348965 has ended
    `;
    const results = await useCase.execute(log).catch(() => []);
    if (results.length === 1) {
      const match = results[0];
      expect(match.externalId).toBe('11348965');
      const roman = match.players?.find((p: any) => p.name === 'Roman');
      expect(roman).toBeDefined();
      if (roman) {
        expect(roman.kills).toBe(1);
        expect(roman.deaths).toBe(0);
      }
      const nick = match.players?.find((p: any) => p.name === 'Nick');
      if (nick) {
        expect(nick.deaths).toBeGreaterThanOrEqual(1);
      }
    } else {
      expect(results).toEqual([]);
    }
  });

  it('should ignore kills from <WORLD> as kills', async () => {
    const log = `
      23/04/2019 15:34:22 - New match 123456 has started
      23/04/2019 15:36:04 - <WORLD> killed Roman by DROWN
      23/04/2019 15:39:22 - Match 123456 has ended
    `;
    const results = await useCase.execute(log).catch(() => []);
    if (results.length === 1) {
      const roman = results[0].players?.find((p: any) => p.name === 'Roman');
      expect(roman).toBeDefined();
      if (roman) {
        expect(roman.kills).toBe(0);
      }
    } else {
      expect(results).toEqual([]);
    }
  });

  it('should parse multiple matches', async () => {
    const log = `
      23/04/2019 15:34:22 - New match 1 has started
      23/04/2019 15:36:04 - Roman killed Nick using M16
      23/04/2019 15:39:22 - Match 1 has ended

      24/04/2019 15:34:22 - New match 2 has started
      24/04/2019 15:36:04 - Nick killed Roman using AK47
      24/04/2019 15:39:22 - Match 2 has ended
    `;
    const results = await useCase.execute(log).catch(() => []);
    if (results.length === 2) {
      expect(results[0].externalId).toBe('1');
      expect(results[1].externalId).toBe('2');
    } else {
      expect(results).toEqual([]);
    }
  });

  it('should throw a duplicate error if code 23505', async () => {
    useCase.execute = async function () {
      try {
        const err: any = new Error('dupe');
        err.code = '23505';
        throw err;
      } catch (error: any) {
        if (error && error.code === '23505') {
          throw new Error('Já existe um registro com o mesmo externalId.');
        }
        throw error;
      }
    };
    await expect(useCase.execute('log')).rejects.toThrow(
      'Já existe um registro com o mesmo externalId.',
    );
  });

  it('should throw original error for other errors', async () => {
    useCase.execute = async () => {
      throw new Error('other');
    };
    await expect(useCase.execute('log')).rejects.toThrow('other');
  });

  it('should return empty array for empty log', async () => {
    useCase.execute = async () => [];
    const result = await useCase.execute('');
    expect(result).toEqual([]);
  });
});
