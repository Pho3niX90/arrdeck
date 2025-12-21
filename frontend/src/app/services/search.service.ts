import { EventEmitter, inject, Injectable } from '@angular/core';
import { ServiceConfig, ServicesService, ServiceType } from './services';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  services = inject(ServicesService)
  sonarr: ServiceConfig | undefined;
  radarr: ServiceConfig | undefined;

  constructor() {
    this.services.getServices().subscribe(services => {
      this.sonarr = services.find(s => s.type === ServiceType.SONARR)
      this.radarr = services.find(s => s.type === ServiceType.RADARR)
    })
  }

  eventEmitter = new EventEmitter<{ title: string, year: number, type: 'movie' | 'show', tmdbId?: number, traktId?: number }>()
}
