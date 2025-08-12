import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesController } from './matches/controllers/matches.controller';
import { KillEntity } from './matches/entities/kill.entity';
import { MatchPlayerEntity } from './matches/entities/match-player.entity';
import { MatchEntity } from './matches/entities/match.entity';
import { PlayerEntity } from './matches/entities/player.entity';
import { UploadCleanupService } from './matches/services/upload-cleanup.service';
import { UploadService } from './matches/services/upload.service';
import { GetGlobalRankingUseCase } from './matches/use-cases/getGlobalRanking.usecase';
import { GetMatchesUseCase } from './matches/use-cases/getMatches.usecase';
import { GetRankingUseCase } from './matches/use-cases/getRanking.usecase';
import { ProcessLogUseCase } from './matches/use-cases/processLog.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchEntity,
      PlayerEntity,
      MatchPlayerEntity,
      KillEntity,
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT
        ? Number(process.env.DATABASE_PORT)
        : 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'nomad_test',
      entities: [MatchEntity, PlayerEntity, MatchPlayerEntity, KillEntity],
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [MatchesController],
  providers: [
    UploadService,
    ProcessLogUseCase,
    GetRankingUseCase,
    GetMatchesUseCase,
    GetGlobalRankingUseCase,
    UploadCleanupService,
  ],
})
export class AppModule {}
