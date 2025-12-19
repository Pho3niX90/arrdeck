import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { RadarrService } from './radarr.service';

@Controller({ path: 'integrations/radarr', version: '1' })
export class RadarrController {
  constructor(private readonly radarrService: RadarrService) {}

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
  async getRootFolders(@Param('id', ParseIntPipe) id: number) {
    return this.radarrService.getRootFolders(id);
  }

  @Post(':id/movie')
  async addMovie(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.radarrService.addMovie(id, body);
  }
}
