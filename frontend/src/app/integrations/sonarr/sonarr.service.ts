import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  SonarrDiskSpace,
  SonarrEpisode,
  SonarrQualityProfile,
  SonarrQueueItem,
  SonarrRootFolder,
  SonarrSeries,
  SonarrSystemStatus
} from './sonarr.models';

@Injectable({
  providedIn: 'root'
})
export class SonarrService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/integrations/sonarr';

  getSystemStatus(serviceId: number): Observable<SonarrSystemStatus> {
    return this.http.get<SonarrSystemStatus>(`${this.apiUrl}/${serviceId}/system/status`);
  }

  getCalendar(serviceId: number, start?: string, end?: string): Observable<SonarrEpisode[]> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    return this.http.get<SonarrEpisode[]>(`${this.apiUrl}/${serviceId}/calendar`, {params});
  }

  getHistory(serviceId: number, page: number = 1, pageSize: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<any>(`${this.apiUrl}/${serviceId}/history`, {params});
  }

  getSeries(serviceId: number): Observable<SonarrSeries[]> {
    return this.http.get<SonarrSeries[]>(`${this.apiUrl}/${serviceId}/series`);
  }

  lookup(serviceId: number, term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${serviceId}/lookup`, {params: {term}});
  }

  getProfiles(serviceId: number): Observable<SonarrQualityProfile[]> {
    return this.http.get<SonarrQualityProfile[]>(`${this.apiUrl}/${serviceId}/qualityprofile`);
  }

  getRootFolders(serviceId: number): Observable<SonarrRootFolder[]> {
    return this.http.get<SonarrRootFolder[]>(`${this.apiUrl}/${serviceId}/rootfolder`);
  }

  addSeries(serviceId: number, series: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${serviceId}/series`, series);
  }

  getQueue(serviceId: number): Observable<SonarrQueueItem[]> {
    return this.http.get<SonarrQueueItem[]>(`${this.apiUrl}/${serviceId}/queue`);
  }

  getDiskSpace(serviceId: number): Observable<SonarrDiskSpace[]> {
    return this.http.get<SonarrDiskSpace[]>(`${this.apiUrl}/${serviceId}/diskspace`);
  }

  getEpisodes(serviceId: number, seriesId: number): Observable<SonarrEpisode[]> {
    return this.http.get<SonarrEpisode[]>(`${this.apiUrl}/${serviceId}/episode`, {params: {seriesId}});
  }
}
