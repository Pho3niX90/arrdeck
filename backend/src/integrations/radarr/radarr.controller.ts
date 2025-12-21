import {Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseInterceptors,} from '@nestjs/common';
import {CacheInterceptor} from '@nestjs/cache-manager';
import {RadarrService} from './radarr.service';

@Controller({path: 'integrations/radarr', version: '1'})
export class RadarrController {
    constructor(private readonly radarrService: RadarrService) {
    }

    @Get(':id/system/status')
    async getSystemStatus(@Param('id', ParseIntPipe) id: number) {
        return this.radarrService.getSystemStatus(id);
    }

    @Get(':id/movie')
    @UseInterceptors(CacheInterceptor)
    async getMovies(@Param('id', ParseIntPipe) id: number) {
        return this.radarrService.getMovies(id);
    }

    @Get(':id/history')
    async getHistory(@Param('id', ParseIntPipe) id: number) {
        return this.radarrService.getHistory(id);
    }

    @Get(':id/lookup')
    async lookup(
        @Param('id', ParseIntPipe) id: number,
        @Query('term') term: string,
    ) {
        return this.radarrService.lookup(id, term);
    }

    @Get(':id/qualityprofile')
    async getProfiles(@Param('id', ParseIntPipe) id: number) {
        return this.radarrService.getProfiles(id);
    }

    @Get(':id/rootfolder')
    getRootFolders(@Param('id') id: string) {
        return this.radarrService.getRootFolders(+id);
    }

    @Post(':id/collection')
    addCollection(@Param('id') id: string, @Body() body: any) {
        return this.radarrService.addCollection(+id, body);
    }

    @Put(':id/collection')
    updateCollection(@Param('id') id: string, @Body() body: any) {
        return this.radarrService.updateCollection(+id, body);
    }

    @Post(':id/movie')
    addMovie(@Param('id') id: string, @Body() body: any) {
        return this.radarrService.addMovie(+id, body);
    }

    @Get(':id/calendar')
    async getCalendar(
        @Param('id', ParseIntPipe) id: number,
        @Query('start') start?: string,
        @Query('end') end?: string,
    ) {
        return this.radarrService.getCalendar(id, start, end);
    }

    @Get(':id/queue')
    async getQueue(@Param('id', ParseIntPipe) id: number) {
        return this.radarrService.getQueue(id);
    }

    @Get(':id/diskspace')
    async getDiskSpace(@Param('id', ParseIntPipe) id: number) {
        return this.radarrService.getDiskSpace(id);
    }
}
