import {Injectable, InternalServerErrorException, NotFoundException,} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {ServicesService} from '../../services/services.service';
import {lastValueFrom} from 'rxjs';
import {SonarrQueueResponse} from './sonarr.models';

@Injectable()
export class SonarrService {
    constructor(
        private httpService: HttpService,
        private servicesService: ServicesService,
    ) {
    }

    private async getService(serviceId: number) {
        const service = await this.servicesService.findOne(serviceId);
        if (!service) {
            throw new NotFoundException('Service not found');
        }
        // Strict typing check could be added here, but for now we assume the user picked the right service
        return service;
    }

    private async makeRequest(
        serviceId: number,
        endpoint: string,
        params: any = {},
    ) {
        const service = await this.getService(serviceId);
        const baseUrl = service.url.replace(/\/$/, '');
        const url = `${baseUrl}/api/v3/${endpoint}`;

        try {
            const response = await lastValueFrom(
                this.httpService.get(url, {
                    params: {...params, apikey: service.apiKey},
                    headers: {'X-Api-Key': service.apiKey},
                }),
            );
            return response.data;
        } catch (error) {
            console.error(`Sonarr Request Error (${endpoint}):`, error.message);
            throw new InternalServerErrorException(
                error.response?.data || 'Failed to contact Sonarr',
            );
        }
    }

    async getHealth(serviceId: number) {
        return this.makeRequest(serviceId, 'health');
    }

    async getSystemStatus(serviceId: number) {
        return this.makeRequest(serviceId, 'system/status');
    }

    async getCalendar(serviceId: number, start?: string, end?: string) {
        return this.makeRequest(serviceId, 'calendar', {start, end});
    }

    async getHistory(serviceId: number, page: number = 1, pageSize: number = 10) {
        return this.makeRequest(serviceId, 'history', {
            page,
            pageSize,
            sortKey: 'date',
            sortDir: 'desc',
        });
    }

    async getSeries(serviceId: number) {
        return this.makeRequest(serviceId, 'series');
    }

    async lookup(serviceId: number, term: string) {
        return this.makeRequest(serviceId, 'series/lookup', {term});
    }

    async getProfiles(serviceId: number) {
        return this.makeRequest(serviceId, 'qualityprofile');
    }

    async getRootFolders(serviceId: number) {
        return this.makeRequest(serviceId, 'rootfolder');
    }

    async addSeries(serviceId: number, seriesFn: any) {
        const service = await this.getService(serviceId);
        const baseUrl = service.url.replace(/\/$/, '');
        const url = `${baseUrl}/api/v3/series`;

        try {
            const response = await lastValueFrom(
                this.httpService.post(url, seriesFn, {
                    params: {apikey: service.apiKey},
                    headers: {'X-Api-Key': service.apiKey},
                }),
            );
            return response.data;
        } catch (error) {
            console.error(`Sonarr Add Series Error:`, error.message);
            throw new InternalServerErrorException(
                error.response?.data || 'Failed to add series to Sonarr',
            );
        }
    }

    async getRecommendations(serviceId: number) {
        return this.makeRequest(serviceId, 'importlist/series', {
            includeRecommendations: true,
            includeTrending: true,
            includePopular: true,
        });
    }

    async getQueue(serviceId: number): Promise<SonarrQueueResponse> {
        return this.makeRequest(serviceId, 'queue');
    }

    async getDiskSpace(serviceId: number) {
        return this.makeRequest(serviceId, 'diskspace');
    }

    async getEpisodes(serviceId: number, seriesId: number) {
        return this.makeRequest(serviceId, 'episode', {seriesId});
    }
}
