import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadCleanupService {
  private readonly logger = new Logger(UploadCleanupService.name);
  private readonly uploadsDir = path.resolve(__dirname, '../../../uploads');

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCron() {
    this.logger.log('Iniciando limpeza da pasta uploads...');
    fs.readdir(this.uploadsDir, (err, files) => {
      if (err) {
        this.logger.error('Erro ao ler a pasta uploads:', err);
        return;
      }
      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            this.logger.error(`Erro ao remover arquivo ${file}:`, err);
          } else {
            this.logger.log(`Arquivo removido: ${file}`);
          }
        });
      }
    });
  }
}
