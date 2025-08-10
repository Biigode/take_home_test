import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { ProcessLogUseCase } from '../use-cases/processLog.usecase';

@Injectable()
export class UploadService {
  constructor(private readonly processLogUseCase: ProcessLogUseCase) {}

  async processUploadedFile(file: Express.Multer.File) {
    const filePath = path.join(__dirname, '../../../', file.path);
    const content = await readFile(filePath, 'utf8');

    const matches = this.processLogUseCase.execute(content);

    return {
      filename: file.filename,
      matches,
    };
  }
}
