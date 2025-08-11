import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { multerConfig } from '../infrastructure/upload/multer.config';
import { UploadService } from '../services/upload.service';
import { GetMatchesUseCase } from '../use-cases/getMatches.usecase';
import { GetRankingUseCase } from '../use-cases/getRanking.usecase';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly getRankingUseCase: GetRankingUseCase,
    private readonly getMatchesUseCase: GetMatchesUseCase,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      return await this.uploadService.processUploadedFile(file);
    } catch (error: any) {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.message || 'Erro ao processar upload.',
      );
    }
  }

  @Get()
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Quantidade de itens por página',
  })
  async listMatches(@Query() query: PaginationQueryDto) {
    return this.getMatchesUseCase.execute(query.page, query.limit);
  }

  @Get(':matchId/ranking')
  async getRanking(@Param('matchId') matchId: string) {
    return this.getRankingUseCase.execute(matchId);
  }
}
