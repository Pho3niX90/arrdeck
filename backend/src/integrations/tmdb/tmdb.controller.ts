import { Controller, Get, Param } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('api/v1/integrations/tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get(':id/movie/:tmdbId')
  async getMovie(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
    return this.tmdbService.getMovie(id, tmdbId);
  }

  @Get(':id/tv/:tmdbId')
  async getTv(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
    return this.tmdbService.getTv(id, tmdbId);
  }
}
