import {Controller, Get, Query} from '@nestjs/common';
import {MetadataService} from './metadata.service';

@Controller({
    path: 'metadata',
    version: '1',
})
export class MetadataController {
    constructor(private readonly metadataService: MetadataService) {
    }

    @Get('resolve')
    async resolve(
        @Query('type') type: 'movie' | 'show',
        @Query('tmdbId') tmdbId?: number,
        @Query('traktId') traktId?: number,
        @Query('tvdbId') tvdbId?: number,
        @Query('imdbId') imdbId?: string,
    ) {
        return this.metadataService.resolveAndFetch({
            tmdb: tmdbId ? Number(tmdbId) : undefined,
            trakt: traktId ? Number(traktId) : undefined,
            tvdb: tvdbId ? Number(tvdbId) : undefined,
            imdb: imdbId
        }, type);
    }
}
