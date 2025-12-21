import {inject, Injectable, signal} from '@angular/core';
import {SonarrService} from './sonarr.service';
import {SonarrSeries} from './sonarr.models';
import {catchError, of, tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SonarrDataService {
  private sonarrApi = inject(SonarrService);

  // Cache: ServiceID -> Map<SeriesID, Series>
  private seriesCache = signal<Map<number, Map<number, SonarrSeries>>>(new Map());
  private recommendationsCache = new Map<number, SonarrSeries[]>();

  // Track loading state per service
  loading = signal<Map<number, boolean>>(new Map());

  /**
   * Ensures series data is loaded for a specific service.
   * If not present, fetches from API and caches it.
   */
  loadSeries(serviceId: number) {
    if (this.seriesCache().has(serviceId)) {
      return of(true);
    }

    this.setLoading(serviceId, true);

    return this.sonarrApi.getSeries(serviceId).pipe(
      tap((seriesList) => {
        const seriesMap = new Map<number, SonarrSeries>();
        seriesList.forEach(s => seriesMap.set(s.id, s));

        this.seriesCache.update(cache => {
          const newCache = new Map(cache);
          newCache.set(serviceId, seriesMap);
          return newCache;
        });

        this.setLoading(serviceId, false);
      }),
      catchError(err => {
        console.error(`Failed to load series for service ${serviceId}`, err);
        this.setLoading(serviceId, false);
        return of(false);
      })
    );
  }

  getSeries(serviceId: number, seriesId: number): SonarrSeries | undefined {
    return this.seriesCache().get(serviceId)?.get(seriesId);
  }

  getQueue(serviceId: number) {
    return this.sonarrApi.getQueue(serviceId);
  }

  getSeriesForService(serviceId: number): SonarrSeries[] {
    const map = this.seriesCache().get(serviceId);
    return map ? Array.from(map.values()) : [];
  }

  private setLoading(serviceId: number, isLoading: boolean) {
    this.loading.update(map => {
      const newMap = new Map(map);
      newMap.set(serviceId, isLoading);
      return newMap;
    });
  }


}
