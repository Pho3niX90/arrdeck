import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ServicesService } from '../../services/services.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RadarrService {
  private readonly logger = new Logger(RadarrService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly serviceService: ServicesService,
    private readonly configService: ConfigService,
  ) {}

  private async getServiceConfig(id: number) {
    const service = await this.serviceService.findOne(id);
    if (!service) {
      throw new Error(`Service with ID ${id} not found`);
    }
    return service;
  }

  private async makeRequest(
    serviceId: number,
    endpoint: string,
    params: any = {},
  ) {
    const config = await this.getServiceConfig(serviceId);
    const url = `${config.url.replace(/\/$/, '')}${endpoint}`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            apikey: config.apiKey,
            ...params,
          },
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(`Error requesting ${url}`, error);
      throw error;
    }
  }

  async getSystemStatus(serviceId: number) {
    return this.makeRequest(serviceId, '/api/v3/system/status');
  }

  async getMovies(serviceId: number) {
    return this.makeRequest(serviceId, '/api/v3/movie');
  }

  async getHistory(serviceId: number, page: number = 1, pageSize: number = 20) {
    return this.makeRequest(serviceId, '/api/v3/history', {
      page,
      pageSize,
      sortKey: 'date',
      sortDir: 'desc',
    });
  }

  async lookup(serviceId: number, term: string) {
    return this.makeRequest(serviceId, '/api/v3/movie/lookup', { term });
  }

  async getProfiles(serviceId: number) {
    return this.makeRequest(serviceId, '/api/v3/qualityprofile');
  }

  async getRootFolders(serviceId: number) {
    return this.makeRequest(serviceId, '/api/v3/rootfolder');
  }

  async addMovie(serviceId: number, movieFn: any) {
    const config = await this.getServiceConfig(serviceId);
    // Radarr API expects POST to /api/v3/movie
    const url = `${config.url.replace(/\/$/, '')}/api/v3/movie`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, movieFn, {
          params: { apikey: config.apiKey },
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(`Error adding movie to Radarr ${url}`, error);
      throw error;
    }
  }

  async getRecommendations(serviceId: number) {
    return this.makeRequest(serviceId, '/api/v3/importlist/movie', {
      includeRecommendations: true,
      includeTrending: true,
      includePopular: true,
    });
  }
}
