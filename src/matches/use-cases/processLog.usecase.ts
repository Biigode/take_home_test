import { Injectable } from '@nestjs/common';

export interface PlayerStats {
  name: string;
  kills: number;
  deaths: number;
}

export interface MatchResult {
  matchId: string;
  players: PlayerStats[];
}

@Injectable()
export class ProcessLogUseCase {
  execute(logContent: string): MatchResult[] {
    const lines = logContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const matches: MatchResult[] = [];
    let currentMatch: MatchResult | null = null;

    for (const line of lines) {
      if (line.includes('New match')) {
        const matchId = line.match(/New match (\d+) has started/)?.[1];
        if (matchId) {
          currentMatch = { matchId, players: [] };
        }
      } else if (line.includes('killed') && line.includes('using')) {
        const killRegex = / - (.+) killed (.+) using (.+)/;
        const [, killer, victim] = line.match(killRegex) || [];

        if (currentMatch && killer && victim) {
          if (killer !== '<WORLD>') {
            let killerStats = currentMatch.players.find(
              (p) => p.name === killer,
            );
            if (!killerStats) {
              killerStats = { name: killer, kills: 0, deaths: 0 };
              currentMatch.players.push(killerStats);
            }
            killerStats.kills += 1;
          }

          let victimStats = currentMatch.players.find((p) => p.name === victim);
          if (!victimStats) {
            victimStats = { name: victim, kills: 0, deaths: 0 };
            currentMatch.players.push(victimStats);
          }
          victimStats.deaths += 1;
        }
      } else if (line.includes('<WORLD> killed') && line.includes('by')) {
        const worldKillRegex = / - <WORLD> killed (.+) by (.+)/;
        const [, victim] = line.match(worldKillRegex) || [];
        if (currentMatch && victim) {
          let victimStats = currentMatch.players.find((p) => p.name === victim);
          if (!victimStats) {
            victimStats = { name: victim, kills: 0, deaths: 0 };
            currentMatch.players.push(victimStats);
          }
          victimStats.deaths += 1;
        }
      } else if (line.includes('Match') && line.includes('has ended')) {
        if (currentMatch) {
          matches.push(currentMatch);
          currentMatch = null;
        }
      }
    }

    return matches;
  }
}
