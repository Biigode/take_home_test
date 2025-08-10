import { ProcessLogUseCase } from './processLog.usecase';

describe('ProcessLogUseCase', () => {
  let useCase: ProcessLogUseCase;

  beforeEach(() => {
    useCase = new ProcessLogUseCase();
  });

  it('should parse matches and player stats correctly', () => {
    const log = `
      23/04/2019 15:34:22 - New match 11348965 has started
      23/04/2019 15:36:04 - Roman killed Nick using M16
      23/04/2019 15:36:33 - <WORLD> killed Nick by DROWN
      23/04/2019 15:39:22 - Match 11348965 has ended
    `;

    const results = useCase.execute(log);

    expect(results).toHaveLength(1);
    const match = results[0];
    expect(match.matchId).toBe('11348965');

    const roman = match.players.find((p) => p.name === 'Roman');
    expect(roman).toBeDefined();
    expect(roman!.kills).toBe(1);
    expect(roman!.deaths).toBe(0);

    const nick = match.players.find((p) => p.name === 'Nick');
    expect(nick).toBeDefined();
    expect(nick!.kills).toBe(0);
    expect(nick!.deaths).toBe(2); // killed by Roman and by <WORLD>
  });

  it('should ignore kills from <WORLD> as kills', () => {
    const log = `
      23/04/2019 15:34:22 - New match 123456 has started
      23/04/2019 15:36:04 - <WORLD> killed Roman by DROWN
      23/04/2019 15:39:22 - Match 123456 has ended
    `;

    const results = useCase.execute(log);
    expect(results).toHaveLength(1);
    const roman = results[0].players.find((p) => p.name === 'Roman');
    expect(roman).toBeDefined();
    expect(roman!.kills).toBe(0);
    expect(roman!.deaths).toBe(1);
  });

  it('should parse multiple matches', () => {
    const log = `
      23/04/2019 15:34:22 - New match 1 has started
      23/04/2019 15:36:04 - Roman killed Nick using M16
      23/04/2019 15:39:22 - Match 1 has ended

      24/04/2019 15:34:22 - New match 2 has started
      24/04/2019 15:36:04 - Nick killed Roman using AK47
      24/04/2019 15:39:22 - Match 2 has ended
    `;

    const results = useCase.execute(log);
    expect(results).toHaveLength(2);

    expect(results[0].matchId).toBe('1');
    expect(results[1].matchId).toBe('2');
  });
});
