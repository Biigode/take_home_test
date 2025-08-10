import { ProcessLogUseCase } from '../use-cases/processLog.usecase';
import * as fs from 'fs/promises';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let processLogUseCase: ProcessLogUseCase;

  beforeEach(() => {
    processLogUseCase = new ProcessLogUseCase();
    service = new UploadService(processLogUseCase);
  });

  it('should read file and return parsed matches', async () => {
    const fakeFile = {
      filename: 'test.txt',
      path: 'uploads/test.txt',
    } as Express.Multer.File;
    const fakeContent = 'fake log content';

    jest.spyOn(fs, 'readFile').mockResolvedValue(fakeContent);
    jest
      .spyOn(processLogUseCase, 'execute')
      .mockReturnValue([{ matchId: '1', players: [] }]);

    const result = await service.processUploadedFile(fakeFile);

    expect(fs.readFile).toHaveBeenCalled();
    expect(processLogUseCase.execute).toHaveBeenCalledWith(fakeContent);
    expect(result.filename).toBe('test.txt');
    expect(result.matches).toHaveLength(1);
  });
});
