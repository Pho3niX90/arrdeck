import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../../services/service.entity';
import axios from 'axios';

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);

  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  private async getService(serviceId: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new Error('Service not found');
    }
    return service;
  }

  private async makeRequest(
    service: Service,
    endpoint: string,
    params: Record<string, any> = {},
  ) {
    const baseUrl = service.url.replace(/\/$/, ''); // Remove trailing slash
    const url = `${baseUrl}${endpoint}`;

    // TMDB v3 auth via query param 'api_key'
    const queryParams = {
      api_key: service.apiKey,
      language: 'en-US',
      ...params,
    };

    try {
      const response = await axios.get(url, { params: queryParams });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error requesting ${url}: ${error.message}`);
      throw error;
    }
  }

  async getMovie(serviceId: number, tmdbId: number) {
    const service = await this.getService(serviceId);
    return this.makeRequest(service, `/3/movie/${tmdbId}`, {
      append_to_response: 'credits,images,external_ids',
    });
  }

  async getTv(serviceId: number, tmdbId: number) {
    const service = await this.getService(serviceId);
    return this.makeRequest(service, `/3/tv/${tmdbId}`, {
      append_to_response: 'credits,images,external_ids',
    });
  }
}
