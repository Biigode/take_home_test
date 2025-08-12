/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';

import { UploadService } from '../services/upload.service';
import { GetGlobalRankingUseCase } from '../use-cases/getGlobalRanking.usecase';
import { GetMatchesUseCase } from '../use-cases/getMatches.usecase';
import { GetRankingUseCase } from '../use-cases/getRanking.usecase';
import { MatchesController } from './matches.controller';

describe('MatchesController', () => {
  let controller: MatchesController;
  let uploadService: UploadService;
  let getMatchesUseCase: GetMatchesUseCase;
  let getRankingUseCase: GetRankingUseCase;
  let getGlobalRankingUseCase: GetGlobalRankingUseCase;

  beforeEach(() => {
    uploadService = {
      processUploadedFile: jest.fn(),
    } as unknown as UploadService;
    getMatchesUseCase = { execute: jest.fn() } as unknown as GetMatchesUseCase;
    getRankingUseCase = { execute: jest.fn() } as unknown as GetRankingUseCase;
    getGlobalRankingUseCase = {
      execute: jest.fn(),
    } as unknown as GetGlobalRankingUseCase;
    controller = new MatchesController(
      uploadService,
      getRankingUseCase,
      getMatchesUseCase,
      getGlobalRankingUseCase,
    );
  });

  it('should call UploadService.processUploadedFile and return its result', async () => {
    const fakeFile = { filename: 'file.txt' } as Express.Multer.File;
    const fakeResult = { filename: 'file.txt', matches: [] };
    (uploadService.processUploadedFile as jest.Mock).mockResolvedValue(
      fakeResult,
    );

    const result = await controller.uploadFile(fakeFile);

    expect(uploadService.processUploadedFile).toHaveBeenCalledWith(fakeFile);
    expect(result).toEqual(fakeResult);
  });

  it('should throw BadRequestException if file is not sent', async () => {
    await expect(controller.uploadFile(undefined as any)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.uploadFile(undefined as any)).rejects.toThrow(
      'Arquivo não enviado.',
    );
  });

  it('should throw BadRequestException if UploadService.processUploadedFile throws', async () => {
    const fakeFile = { filename: 'file.txt' } as Express.Multer.File;
    (uploadService.processUploadedFile as jest.Mock).mockRejectedValue(
      new Error('erro de constraint'),
    );

    await expect(controller.uploadFile(fakeFile)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.uploadFile(fakeFile)).rejects.toThrow(
      'erro de constraint',
    );
  });

  it('should call getMatchesUseCase.execute with correct params and return its result', async () => {
    const fakeQuery = { page: 2, limit: 5 };
    const fakeResult = [{ id: 1 }, { id: 2 }];
    (getMatchesUseCase.execute as jest.Mock).mockResolvedValue(fakeResult);

    const result = await controller.listMatches(fakeQuery as any);

    expect(getMatchesUseCase.execute).toHaveBeenCalledWith(
      fakeQuery.page,
      fakeQuery.limit,
    );
    expect(result).toEqual(fakeResult);
  });

  it('should call getRankingUseCase.execute with matchId and return its result', async () => {
    const matchId = 'abc123';
    const fakeResult = { ranking: [1, 2, 3] };
    (getRankingUseCase.execute as jest.Mock).mockResolvedValue(fakeResult);

    const result = await controller.getRanking(matchId);

    expect(getRankingUseCase.execute).toHaveBeenCalledWith(matchId);
    expect(result).toEqual(fakeResult);
  });
});
