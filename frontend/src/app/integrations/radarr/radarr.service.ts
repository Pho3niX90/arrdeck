import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RadarrMovie } from './radarr.models';

@Injectable({
    providedIn: 'root'
})
export class RadarrService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/integrations/radarr';

    getSystemStatus(serviceId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${serviceId}/system/status`);
    }

    getMovies(serviceId: number): Observable<RadarrMovie[]> {
        return this.http.get<RadarrMovie[]>(`${this.apiUrl}/${serviceId}/movie`);
    }

    lookup(serviceId: number, term: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${serviceId}/lookup`, { params: { term } });
    }

    getProfiles(serviceId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${serviceId}/qualityprofile`);
    }

    getRootFolders(serviceId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${serviceId}/rootfolder`);
    }

    addMovie(serviceId: number, movie: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${serviceId}/movie`, movie);
    }

    getRecommendations(serviceId: number): Observable<RadarrMovie[]> {
        return this.http.get<RadarrMovie[]>(`${this.apiUrl}/${serviceId}/recommendations`);
    }
}
