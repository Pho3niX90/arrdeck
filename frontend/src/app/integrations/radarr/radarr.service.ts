import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    RadarrMovie,
    RadarrDiskSpace,
    RadarrQueueItem,
    RadarrRootFolder,
    RadarrQualityProfile,
    RadarrSystemStatus
} from './radarr.models';

@Injectable({
    providedIn: 'root'
})
export class RadarrService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/integrations/radarr';

    getSystemStatus(serviceId: number): Observable<RadarrSystemStatus> {
        return this.http.get<RadarrSystemStatus>(`${this.apiUrl}/${serviceId}/system/status`);
    }

    getCalendar(serviceId: number, start?: string, end?: string): Observable<RadarrMovie[]> {
        let params = new HttpParams();
        if (start) params = params.set('start', start);
        if (end) params = params.set('end', end);
        return this.http.get<RadarrMovie[]>(`${this.apiUrl}/${serviceId}/calendar`, { params });
    }

    getMovies(serviceId: number): Observable<RadarrMovie[]> {
        return this.http.get<RadarrMovie[]>(`${this.apiUrl}/${serviceId}/movie`);
    }

    lookup(serviceId: number, term: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${serviceId}/lookup`, { params: { term } });
    }

    getProfiles(serviceId: number): Observable<RadarrQualityProfile[]> {
        return this.http.get<RadarrQualityProfile[]>(`${this.apiUrl}/${serviceId}/qualityprofile`);
    }

    getRootFolders(serviceId: number): Observable<RadarrRootFolder[]> {
        return this.http.get<RadarrRootFolder[]>(`${this.apiUrl}/${serviceId}/rootfolder`);
    }

    addMovie(serviceId: number, movie: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${serviceId}/movie`, movie);
    }

    getQueue(serviceId: number): Observable<RadarrQueueItem[]> {
        return this.http.get<RadarrQueueItem[]>(`${this.apiUrl}/${serviceId}/queue`);
    }

    getDiskSpace(serviceId: number): Observable<RadarrDiskSpace[]> {
        return this.http.get<RadarrDiskSpace[]>(`${this.apiUrl}/${serviceId}/diskspace`);
    }

    addCollection(serviceId: number, collection: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${serviceId}/collection`, collection);
    }

    updateCollection(serviceId: number, collection: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${serviceId}/collection/${collection.id}`, collection);
    }
}
