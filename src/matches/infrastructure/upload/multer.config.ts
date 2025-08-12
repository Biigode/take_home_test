import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ): void => {
    if (extname(file.originalname).toLowerCase() !== '.txt') {
      callback(new BadRequestException('Only .txt files are allowed!'), false);
      return;
    }
    callback(null, true);
  },
};
