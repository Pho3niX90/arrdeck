import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

export interface StatsOverview {
  sonarr: ServiceStats[];
  radarr: ServiceStats[];
}

export interface ServiceStats {
  serviceId: number;
  name: string;
  seriesCount?: number;
  movieCount?: number;
  episodeCount?: number;
  diskSpace: DiskSpace[];
  profiles: { name: string; count: number }[];
}

export interface DiskSpace {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
}

@Injectable({providedIn: 'root'})
export class StatsService {
  http = inject(HttpClient);

  getOverview() {
    return this.http.get<StatsOverview>('/api/stats/overview');
  }
}
