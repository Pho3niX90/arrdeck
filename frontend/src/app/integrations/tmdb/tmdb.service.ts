import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TmdbService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/integrations/tmdb';

    getMovie(serviceId: number, tmdbId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${serviceId}/movie/${tmdbId}`);
    }

    getTv(serviceId: number, tmdbId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${serviceId}/tv/${tmdbId}`);
    }
}
