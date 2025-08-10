import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesController } from './matches/controller/matches.controller';
import { MatchesModule } from './matches/matches.module';
import { UploadService } from './matches/services/upload.service';
import { ProcessLogUseCase } from './matches/use-cases/processLog.usecase';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT
        ? Number(process.env.DATABASE_PORT)
        : 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'nomad_test',
      entities: [],
      synchronize: true,
    }),
    MatchesModule,
  ],
  controllers: [MatchesController],
  providers: [UploadService, ProcessLogUseCase],
})
export class AppModule {}
