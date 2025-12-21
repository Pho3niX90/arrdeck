import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {TmdbCollection, TmdbCredits, TmdbRecommendations} from './tmdb.models';

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

  getSeason(serviceId: number, tmdbId: number, seasonNumber: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${serviceId}/tv/${tmdbId}/season/${seasonNumber}`);
  }

  getCollection(serviceId: number, collectionId: number): Observable<TmdbCollection> {
    return this.http.get<TmdbCollection>(`${this.apiUrl}/${serviceId}/collection/${collectionId}`);
  }

  getMovieCredits(serviceId: number, tmdbId: number): Observable<TmdbCredits> {
    return this.http.get<TmdbCredits>(`${this.apiUrl}/${serviceId}/movie/${tmdbId}/credits`);
  }

  getTvCredits(serviceId: number, tmdbId: number): Observable<TmdbCredits> {
    return this.http.get<TmdbCredits>(`${this.apiUrl}/${serviceId}/tv/${tmdbId}/credits`);
  }

  getMovieRecommendations(serviceId: number, tmdbId: number): Observable<TmdbRecommendations> {
    return this.http.get<TmdbRecommendations>(`${this.apiUrl}/${serviceId}/movie/${tmdbId}/recommendations`);
  }

  getMovieSimilar(serviceId: number, tmdbId: number): Observable<TmdbRecommendations> {
    return this.http.get<TmdbRecommendations>(`${this.apiUrl}/${serviceId}/movie/${tmdbId}/similar`);
  }

  getTvRecommendations(serviceId: number, tmdbId: number): Observable<TmdbRecommendations> {
    return this.http.get<TmdbRecommendations>(`${this.apiUrl}/${serviceId}/tv/${tmdbId}/recommendations`);
  }

  getTvSimilar(serviceId: number, tmdbId: number): Observable<TmdbRecommendations> {
    return this.http.get<TmdbRecommendations>(`${this.apiUrl}/${serviceId}/tv/${tmdbId}/similar`);
  }
}
