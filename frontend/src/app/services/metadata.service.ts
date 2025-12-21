import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';

export interface ResolvedIds {
  tmdb?: number;
  trakt?: number;
  tvdb?: number;
  imdb?: string;
}

export interface NormalizedDetails {
  title: string;
  year: number;
  overview: string;
  runtime: number;
  rating: number; // 0-10
  genres: string[];
  poster_path?: string;
  backdrop_path?: string;
  certification?: string;
  collection?: { id: number; name: string; poster_path?: string; backdrop_path?: string };
  ids: ResolvedIds;
  original_language?: string;
  seasons?: any[];
  images?: any;
  keywords?: string[];
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/metadata';

  resolveAndFetch(ids: ResolvedIds, type: 'movie' | 'show'): Observable<NormalizedDetails> {
    let params = new HttpParams().set('type', type);
    if (ids.tmdb) params = params.set('tmdbId', ids.tmdb);
    if (ids.trakt) params = params.set('traktId', ids.trakt);
    if (ids.tvdb) params = params.set('tvdbId', ids.tvdb);
    if (ids.imdb) params = params.set('imdbId', ids.imdb);

    return this.http.get<NormalizedDetails>(`${this.apiUrl}/resolve`, {params});
  }
}
