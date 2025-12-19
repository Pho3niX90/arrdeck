import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TraktService } from './trakt.service';

@Controller({ path: 'integrations/trakt', version: '1' })
export class TraktController {
  constructor(private readonly traktService: TraktService) {}

  @Get(':id/movies/trending')
  async getTrendingMovies(@Param('id', ParseIntPipe) id: number) {
    return this.traktService.getTrendingMovies(id);
  }

  @Get(':id/shows/trending')
  async getTrendingShows(@Param('id', ParseIntPipe) id: number) {
    return this.traktService.getTrendingShows(id);
  }

  @Get(':id/movies/:traktId')
  async getMovie(
    @Param('id', ParseIntPipe) id: number,
    @Param('traktId', ParseIntPipe) traktId: number,
  ) {
    return this.traktService.getMovie(id, traktId);
  }

  @Get(':id/shows/:traktId')
  async getShow(
    @Param('id', ParseIntPipe) id: number,
    @Param('traktId', ParseIntPipe) traktId: number,
  ) {
    return this.traktService.getShow(id, traktId);
  }

  @Get(':id/movies/:traktId/people')
  async getMoviePeople(
    @Param('id', ParseIntPipe) id: number,
    @Param('traktId', ParseIntPipe) traktId: number,
  ) {
    return this.traktService.getMoviePeople(id, traktId);
  }

  @Get(':id/shows/:traktId/people')
  async getShowPeople(
    @Param('id', ParseIntPipe) id: number,
    @Param('traktId', ParseIntPipe) traktId: number,
  ) {
    return this.traktService.getShowPeople(id, traktId);
  }

  @Get(':id/shows/:traktId/seasons')
  getShowSeasons(@Param('id') id: string, @Param('traktId') traktId: string) {
    return this.traktService.getShowSeasons(+id, +traktId);
  }

  @Get(':id/recommendations/movies')
  getRecommendedMovies(@Param('id') id: string) {
    return this.traktService.getRecommendedMovies(+id);
  }

  @Get(':id/recommendations/shows')
  getRecommendedShows(@Param('id') id: string) {
    return this.traktService.getRecommendedShows(+id);
  }

  @Get(':id/search/:idType/:itemId')
  async search(
    @Param('id') id: string,
    @Param('idType') idType: string,
    @Param('itemId') itemId: string,
    @Query('type') type?: string,
  ) {
    return this.traktService.search(+id, idType, itemId, type);
  }
}
