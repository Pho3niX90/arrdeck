import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TraktTrendingItem, TraktMovie, TraktShow } from './trakt.models';

@Injectable({
    providedIn: 'root'
})
export class TraktService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/integrations/trakt';

    getTrendingMovies(serviceId: number): Observable<TraktTrendingItem<TraktMovie>[]> {
        return this.http.get<TraktTrendingItem<TraktMovie>[]>(`${this.apiUrl}/${serviceId}/movies/trending`);
    }

    getTrendingShows(serviceId: number): Observable<TraktTrendingItem<TraktShow>[]> {
        return this.http.get<TraktTrendingItem<TraktShow>[]>(`${this.apiUrl}/${serviceId}/shows/trending`);
    }

    getMovie(serviceId: number, traktId: number): Observable<TraktMovie> {
        return this.http.get<TraktMovie>(`${this.apiUrl}/${serviceId}/movies/${traktId}`);
    }

    getShow(serviceId: number, traktId: number): Observable<TraktShow> {
        return this.http.get<TraktShow>(`${this.apiUrl}/${serviceId}/shows/${traktId}`);
    }

    getMoviePeople(serviceId: number, traktId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${serviceId}/movies/${traktId}/people`);
    }

    getShowPeople(serviceId: number, traktId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${serviceId}/shows/${traktId}/people`);
    }

    getShowSeasons(serviceId: number, traktId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${serviceId}/shows/${traktId}/seasons`);
    }

    getRecommendedMovies(serviceId: number): Observable<TraktMovie[]> {
        return this.http.get<TraktMovie[]>(`${this.apiUrl}/${serviceId}/recommendations/movies`);
    }

    getRecommendedShows(serviceId: number): Observable<TraktShow[]> {
        return this.http.get<TraktShow[]>(`${this.apiUrl}/${serviceId}/recommendations/shows`);
    }

    search(serviceId: number, idType: string, id: string, type?: string): Observable<any[]> {
        let url = `${this.apiUrl}/${serviceId}/search/${idType}/${id}`;
        if (type) {
            url += `?type=${type}`;
        }
        return this.http.get<any[]>(url);
    }
}
