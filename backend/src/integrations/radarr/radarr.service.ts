import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ServicesService } from '../../services/services.service';
import { firstValueFrom } from 'rxjs';
import { RadarrQueueResponse } from './radarr.models';

@Injectable()
export class RadarrService {
    private readonly logger = new Logger(RadarrService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly serviceService: ServicesService,
        private readonly configService: ConfigService,
    ) {
    }

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

    async getHistory(serviceId: number, page: number = 1, pageSize: number = 50) {
        return this.makeRequest(serviceId, '/api/v3/history', {
            page,
            pageSize,
            sortKey: 'date',
            sortDir: 'desc',
        });
    }

    async lookup(serviceId: number, term: string) {
        const [results, collections] = await Promise.all([
            this.makeRequest(serviceId, '/api/v3/movie/lookup', { term }),
            this.makeRequest(serviceId, '/api/v3/collection')
        ]);

        if (Array.isArray(results) && Array.isArray(collections)) {
            results.forEach((movie: any) => {
                if (movie.collection && movie.collection.tmdbId) {
                    const match = collections.find((c: any) => c.tmdbId === movie.collection.tmdbId);
                    if (match) {
                        movie.collection = match;
                    }
                }
            });
        }
        return results;
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

    async getQueue(serviceId: number): Promise<RadarrQueueResponse> {
        return this.makeRequest(serviceId, '/api/v3/queue', {
            pageSize: 1000,
            includeUnknownMovieItems: true,
        });
    }

    async getDiskSpace(serviceId: number) {
        return this.makeRequest(serviceId, '/api/v3/diskspace');
    }

    async addCollection(serviceId: number, collection: any) {
        const config = await this.getServiceConfig(serviceId);
        const url = `${config.url.replace(/\/$/, '')}/api/v3/collection`;

        try {
            const { data } = await firstValueFrom(
                this.httpService.post(url, collection, {
                    params: { apikey: config.apiKey },
                }),
            );
            return data;
        } catch (error: any) {
            this.logger.error(`Error adding collection to Radarr ${url}`, error.response?.data || error.message);
            throw new Error(JSON.stringify(error.response?.data) || error.message);
        }
    }

    async updateCollection(serviceId: number, collection: any) {
        const config = await this.getServiceConfig(serviceId);
        const url = `${config.url.replace(/\/$/, '')}/api/v3/collection/${collection.id}`;

        try {
            const { data } = await firstValueFrom(
                this.httpService.put(url, collection, {
                    params: { apikey: config.apiKey },
                }),
            );
            return data;
        } catch (error) {
            this.logger.error(`Error updating collection in Radarr ${url}`, error);
            throw error;
        }
    }

    async getCalendar(serviceId: number, start?: string, end?: string) {
        return this.makeRequest(serviceId, '/api/v3/calendar', { start, end });
    }
}
