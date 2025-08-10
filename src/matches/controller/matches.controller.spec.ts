import { UploadService } from '../services/upload.service';
import { MatchesController } from './matches.controller';

describe('MatchesController', () => {
  let controller: MatchesController;
  let service: UploadService;

  beforeEach(() => {
    service = { processUploadedFile: jest.fn() } as any;
    controller = new MatchesController(service);
  });

  it('should call UploadService.processUploadedFile and return its result', async () => {
    const fakeFile = { filename: 'file.txt' } as Express.Multer.File;
    const fakeResult = { filename: 'file.txt', matches: [] };
    (service.processUploadedFile as jest.Mock).mockResolvedValue(fakeResult);

    const result = await controller.uploadFile(fakeFile);

    expect(service.processUploadedFile).toHaveBeenCalledWith(fakeFile);
    expect(result).toEqual(fakeResult);
  });
});
