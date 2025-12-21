import {Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Service} from '../../services/service.entity';
import axios from 'axios';

@Injectable()
export class TmdbService {
    private readonly logger = new Logger(TmdbService.name);

    constructor(
        @InjectRepository(Service)
        private serviceRepository: Repository<Service>,
    ) {
    }

    private async getService(serviceId: number): Promise<Service> {
        const service = await this.serviceRepository.findOne({
            where: {id: serviceId},
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
            const response = await axios.get(url, {params: queryParams});
            return response.data;
        } catch (error: any) {
            this.logger.error(`Error requesting ${url}: ${error.message}`);
            throw error;
        }
    }

    async getMovie(serviceId: number, tmdbId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/movie/${tmdbId}`, {
            append_to_response: 'credits,images,external_ids,keywords',
        });
    }

    async getTv(serviceId: number, tmdbId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/tv/${tmdbId}`, {
            append_to_response: 'credits,images,external_ids,keywords',
        });
    }

    async getSeason(serviceId: number, tmdbId: number, seasonNumber: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(
            service,
            `/tv/${tmdbId}/season/${seasonNumber}`,
            {},
        );
    }

    async getCollection(serviceId: number, collectionId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/collection/${collectionId}`, {
            language: 'en-US',
        });
    }

    async getMovieCredits(serviceId: number, tmdbId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/movie/${tmdbId}/credits`);
    }

    async getTvCredits(serviceId: number, tmdbId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/tv/${tmdbId}/credits`);
    }

    async getMovieRecommendations(serviceId: number, tmdbId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/movie/${tmdbId}/recommendations`);
    }

    async getMovieSimilar(serviceId: number, tmdbId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/movie/${tmdbId}/similar`);
    }

    async getTvRecommendations(serviceId: number, tmdbId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/tv/${tmdbId}/recommendations`);
    }

    async getTvSimilar(serviceId: number, tmdbId: number) {
        const service = await this.getService(serviceId);
        return this.makeRequest(service, `/tv/${tmdbId}/similar`);
    }
}
