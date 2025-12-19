import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ServicesService } from '../../services/services.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TraktService {
  private readonly logger = new Logger(TraktService.name);
  private readonly TRAKT_API_URL = 'https://api.trakt.tv';

  constructor(
    private readonly httpService: HttpService,
    private readonly serviceService: ServicesService,
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

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.TRAKT_API_URL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': config.apiKey,
          },
          params,
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(`Error requesting Trakt ${endpoint}`, error);
      throw error;
    }
  }

  async getTrendingMovies(serviceId: number) {
    return this.makeRequest(serviceId, '/movies/trending', {
      limit: 50,
      extended: 'full,images',
    });
  }

  async getTrendingShows(serviceId: number) {
    return this.makeRequest(serviceId, '/shows/trending', {
      limit: 50,
      extended: 'full,images',
    });
  }

  async getMovie(serviceId: number, traktId: number) {
    return this.makeRequest(serviceId, `/movies/${traktId}`, {
      extended: 'full,images',
    });
  }

  async getShow(serviceId: number, traktId: number) {
    return this.makeRequest(serviceId, `/shows/${traktId}`, {
      extended: 'full,images',
    });
  }

  async getMoviePeople(serviceId: number, traktId: number) {
    return this.makeRequest(serviceId, `/movies/${traktId}/people`, {
      extended: 'full,images',
    });
  }

  async getShowPeople(serviceId: number, traktId: number) {
    return this.makeRequest(serviceId, `/shows/${traktId}/people`, {
      extended: 'full,images',
    });
  }

  async getShowSeasons(serviceId: number, traktId: number) {
    return this.makeRequest(serviceId, `/shows/${traktId}/seasons`, {
      extended: 'full,images',
    });
  }

  async getRecommendedMovies(serviceId: number) {
    return this.makeRequest(serviceId, '/recommendations/movies', {
      limit: 50,
      extended: 'full,images',
      ignore_collected: true,
    });
  }

  async getRecommendedShows(serviceId: number) {
    return this.makeRequest(serviceId, '/recommendations/shows', {
      limit: 50,
      extended: 'full,images',
      ignore_collected: true,
    });
  }

  async search(serviceId: number, idType: string, id: string, type?: string) {
    const params: any = {};
    if (type) params.type = type;
    return this.makeRequest(serviceId, `/search/${idType}/${id}`, params);
  }
}
