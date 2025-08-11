import * as fs from 'fs/promises';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let processLogUseCase: { execute: jest.Mock };

  beforeEach(() => {
    processLogUseCase = { execute: jest.fn() };
    service = new UploadService(processLogUseCase as any);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should read the file and return matches', async () => {
    const fakeFile = {
      filename: 'test.txt',
      path: 'uploads/test.txt',
    } as Express.Multer.File;
    const fakeContent = 'fake log content';
    const fakeMatches = [{ matchId: '1', players: [] }];

    jest.spyOn(fs, 'readFile').mockResolvedValue(fakeContent);
    processLogUseCase.execute.mockResolvedValue(fakeMatches);

    const result = await service.processUploadedFile(fakeFile);

    expect(fs.readFile).toHaveBeenCalled();
    expect(processLogUseCase.execute).toHaveBeenCalledWith(fakeContent);
    expect(result).toEqual(fakeMatches);
  });

  it('should throw a handled error if something fails', async () => {
    const fakeFile = {
      filename: 'test.txt',
      path: 'uploads/test.txt',
    } as Express.Multer.File;
    jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Falha de leitura'));

    await expect(service.processUploadedFile(fakeFile)).rejects.toThrow(
      'Falha de leitura',
    );
  });
});
