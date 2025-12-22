import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, Observable} from 'rxjs';

export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  ProductionYear?: number;
}

export interface JellyfinSearchResult {
  Items: JellyfinItem[];
  TotalRecordCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class JellyfinService {
  private http = inject(HttpClient);

  search(url: string, apiKey: string, query: string): Observable<JellyfinItem[]> {
    // Search for Movie or Series
    const cleanUrl = url.replace(/\/$/, '');
    const headers = new HttpHeaders({
      'X-Emby-Token': apiKey
    });

    return this.http.get<JellyfinSearchResult>(`${cleanUrl}/Items`, {
      headers,
      params: {
        Recursive: 'true',
        SearchTerm: query,
        IncludeItemTypes: 'Movie,Series',
        Limit: '5'
      }
    }).pipe(
      map(res => res.Items)
    );
  }

  getDeepLink(url: string, itemId: string): string {
    const cleanUrl = url.replace(/\/$/, '');
    return `${cleanUrl}/web/index.html#!/details?id=${itemId}`;
  }
}
