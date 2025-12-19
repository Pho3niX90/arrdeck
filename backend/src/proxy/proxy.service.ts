import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ServicesService } from '../services/services.service';
import { lastValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class ProxyService {
  constructor(
    private httpService: HttpService,
    private servicesService: ServicesService,
  ) {}

  async proxyRequest(
    serviceId: number,
    path: string,
    method: string,
    body: any,
    query: any,
  ) {
    const service = await this.servicesService.findOne(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const baseUrl = service.url.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    const targetUrl = `${baseUrl}/${cleanPath}`;

    const config: AxiosRequestConfig = {
      method,
      url: targetUrl,
      params: { ...query, apikey: service.apiKey },
      data: body,
      headers: {
        'X-Api-Key': service.apiKey,
      },
    };

    try {
      const response = await lastValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error) {
      // Forward error or wrap it
      console.error('Proxy Error:', error.message);
      if (error.response) {
        throw new InternalServerErrorException(error.response.data);
      }
      throw new InternalServerErrorException('Failed to proxy request');
    }
  }
}
