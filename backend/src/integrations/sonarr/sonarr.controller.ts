import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SonarrService } from './sonarr.service';

@Controller({ path: 'integrations/sonarr', version: '1' })
export class SonarrController {
  constructor(private readonly sonarrService: SonarrService) {}

  @Get(':id/health')
  getHealth(@Param('id') id: string) {
    return this.sonarrService.getHealth(+id);
  }

  @Get(':id/system/status')
  getSystemStatus(@Param('id') id: string) {
    return this.sonarrService.getSystemStatus(+id);
  }

  @Get(':id/calendar')
  getCalendar(
    @Param('id') id: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.sonarrService.getCalendar(+id, start, end);
  }

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.sonarrService.getHistory(+id, page, pageSize);
  }

  @Get(':id/series')
  @UseInterceptors(CacheInterceptor)
  getSeries(@Param('id') id: string) {
    return this.sonarrService.getSeries(+id);
  }

  @Get(':id/lookup')
  lookup(@Param('id') id: string, @Query('term') term: string) {
    return this.sonarrService.lookup(+id, term);
  }

  @Get(':id/qualityprofile')
  getProfiles(@Param('id') id: string) {
    return this.sonarrService.getProfiles(+id);
  }

  @Get(':id/rootfolder')
  getRootFolders(@Param('id') id: string) {
    return this.sonarrService.getRootFolders(+id);
  }

  @Post(':id/series')
  addSeries(@Param('id') id: string, @Body() body: any) {
    return this.sonarrService.addSeries(+id, body);
  }
}
