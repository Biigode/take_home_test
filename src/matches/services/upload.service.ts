import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { ProcessLogUseCase } from '../use-cases/processLog.usecase';

@Injectable()
export class UploadService {
  constructor(private readonly processLogUseCase: ProcessLogUseCase) {}

  async processUploadedFile(file: Express.Multer.File) {
    try {
      const filePath = path.join(__dirname, '../../../', file.path);
      const content = await readFile(filePath, 'utf8');

      const matches = await this.processLogUseCase.execute(content);
      return matches;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(error.message || 'Erro ao processar arquivo.');
    }
  }
}
