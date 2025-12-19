import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum ServiceType {
  SONARR = 'sonarr',
  RADARR = 'radarr',
  PROWLARR = 'prowlarr',
  DELUGE = 'deluge',
  JELLYSEER = 'jellyseer',
  TRAKT = 'trakt',
  TVDB = 'tvdb',
  TMDB = 'tmdb',
  AI = 'ai',
  OTHER = 'other',
}

export interface ServiceConfig {
  id?: number;
  name: string;
  type: ServiceType;
  url: string;
  apiKey: string;
  model?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/services';

  getServices(): Observable<ServiceConfig[]> {
    return this.http.get<ServiceConfig[]>(this.apiUrl);
  }

  createService(service: ServiceConfig): Observable<ServiceConfig> {
    return this.http.post<ServiceConfig>(this.apiUrl, service);
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateService(id: number, service: Partial<ServiceConfig>): Observable<ServiceConfig> {
    return this.http.put<ServiceConfig>(`${this.apiUrl}/${id}`, service);
  }

  getSystemStatus(service: ServiceConfig): Observable<any> {
    const integrationPath = this.getIntegrationPath(service.type);
    if (!integrationPath) {
      // For types without specific integrations, maybe return a mock or empty
      return new Observable(observer => {
        observer.next({ status: 'unknown' });
        observer.complete();
      });
    }
    return this.http.get<any>(`/api/v1/integrations/${integrationPath}/${service.id}/system/status`);
  }

  private getIntegrationPath(type: ServiceType): string | null {
    switch (type) {
      case ServiceType.SONARR:
        return 'sonarr';
      case ServiceType.RADARR:
        return 'radarr';
      // case ServiceType.PROWLARR: return 'prowlarr';
      // case ServiceType.DELUGE: return 'deluge';
      default:
        return null;
    }
  }
}
