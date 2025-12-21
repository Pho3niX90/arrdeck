import {Controller, Get, Param} from '@nestjs/common';
import {TmdbService} from './tmdb.service';

@Controller({path: 'integrations/tmdb', version: '1'})
export class TmdbController {
    constructor(private readonly tmdbService: TmdbService) {
    }

    @Get(':id/movie/:tmdbId')
    async getMovie(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
        return this.tmdbService.getMovie(id, tmdbId);
    }

    @Get(':id/tv/:tmdbId')
    async getTv(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
        return this.tmdbService.getTv(id, tmdbId);
    }

    @Get(':id/tv/:tmdbId/season/:seasonNumber')
    async getSeason(
        @Param('id') id: number,
        @Param('tmdbId') tmdbId: number,
        @Param('seasonNumber') seasonNumber: number,
    ) {
        return this.tmdbService.getSeason(id, tmdbId, seasonNumber);
    }

    @Get(':id/collection/:collectionId')
    async getCollection(@Param('id') id: number, @Param('collectionId') collectionId: number) {
        return this.tmdbService.getCollection(id, collectionId);
    }

    @Get(':id/movie/:tmdbId/credits')
    async getMovieCredits(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
        return this.tmdbService.getMovieCredits(id, tmdbId);
    }

    @Get(':id/tv/:tmdbId/credits')
    async getTvCredits(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
        return this.tmdbService.getTvCredits(id, tmdbId);
    }

    @Get(':id/movie/:tmdbId/recommendations')
    async getMovieRecommendations(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
        return this.tmdbService.getMovieRecommendations(id, tmdbId);
    }

    @Get(':id/movie/:tmdbId/similar')
    async getMovieSimilar(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
        return this.tmdbService.getMovieSimilar(id, tmdbId);
    }

    @Get(':id/tv/:tmdbId/recommendations')
    async getTvRecommendations(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
        return this.tmdbService.getTvRecommendations(id, tmdbId);
    }

    @Get(':id/tv/:tmdbId/similar')
    async getTvSimilar(@Param('id') id: number, @Param('tmdbId') tmdbId: number) {
        return this.tmdbService.getTvSimilar(id, tmdbId);
    }
}
