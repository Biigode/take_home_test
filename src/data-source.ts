// import { DataSource } from 'typeorm';
// import { MatchPlayerEntity } from './matches/entities/match-player.entity';
// import { KillEntity } from './matches/entities/kill.entity';
// import { MatchEntity } from './matches/entities/match.entity';
// import { PlayerEntity } from './matches/entities/player.entity';

// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.DATABASE_HOST || 'localhost',
//   port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
//   username: process.env.DATABASE_USER || 'postgres',
//   password: process.env.DATABASE_PASSWORD || 'postgres',
//   database: process.env.DATABASE_NAME || 'nomad_test',
//   entities: [MatchEntity, PlayerEntity, MatchPlayerEntity, KillEntity],
//   migrations: ['dist/matches/migrations/*.js'],
//   synchronize: false,
// });
