import {inject, Injectable} from '@angular/core';
import {forkJoin, map, Observable, of, shareReplay, switchMap} from 'rxjs';
import {ServicesService, ServiceType} from './services';
import {RadarrService} from '../integrations/radarr/radarr.service';
import {SonarrService} from '../integrations/sonarr/sonarr.service';
import {TmdbCollection} from '../integrations/tmdb/tmdb.models';

export interface LibraryStatus {
  inLibrary: boolean;
  radarrId?: number;
  sonarrId?: number;
  sonarrEpisodes?: Record<number, Set<number>>;
  collectionTmdbId?: number;
  images?: any;
}

export interface LibraryItem {
  uniqueId: string; // type-id
  type: 'movie' | 'show';
  title: string;
  year: number;
  overview: string;
  tmdbId: number;
  tvdbId?: number;
  posterUrl?: string;
  rating: number; // 0-10
  runtime?: number; // minutes
  added: Date;
  status: string;
  serviceId: number;
  seasons?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private servicesService = inject(ServicesService);
  private radarrService = inject(RadarrService);
  private sonarrService = inject(SonarrService);

  private movieCache = new Set<number>();
  private cacheInitialization$: Observable<void> | null = null;

  // Cache for the unified library to avoid re-fetching on every widget
  private libraryCache$: Observable<LibraryItem[]> | null = null;

  checkLibrary(type: 'movie' | 'show', tmdbId: number, tvdbId?: number): Observable<LibraryStatus> {
    return this.servicesService.getServices().pipe(
      switchMap(services => {
        const targetType = type === 'movie' ? ServiceType.RADARR : ServiceType.SONARR;
        const service = services.find(s => s.type === targetType);

        if (!service) {
          return of({inLibrary: false});
        }

        const term = `tmdb:${tmdbId}`;

        if (type === 'movie') {
          return this.radarrService.lookup(service.id!, term).pipe(
            map(results => {
              const match = results.find(m => m.tmdbId === tmdbId);
              if (!match) return {inLibrary: false};

              return {
                inLibrary: !!match.id,
                radarrId: match.id,
                collectionTmdbId: match.collection?.tmdbId,
                images: match.images
              };
            })
          );
        } else {
          return this.sonarrService.lookup(service.id!, term).pipe(
            switchMap(results => {
              const match = results.find(s =>
                (tvdbId && s.tvdbId === tvdbId) ||
                ((s as any).tmdbId === tmdbId)
              );

              if (!match || !match.id) return of({inLibrary: false});

              return this.sonarrService.getEpisodes(service.id!, match.id).pipe(
                map(episodes => {
                  const episodeMap: Record<number, Set<number>> = {};
                  episodes.forEach((ep: any) => {
                    if (ep.hasFile) {
                      if (!episodeMap[ep.seasonNumber]) episodeMap[ep.seasonNumber] = new Set();
                      episodeMap[ep.seasonNumber].add(ep.episodeNumber);
                    }
                  });
                  return {
                    inLibrary: true,
                    sonarrId: match.id,
                    sonarrEpisodes: episodeMap
                  };
                })
              );
            })
          );
        }
      })
    );
  }

  addCollection(col: TmdbCollection, config: {
    serviceId: number,
    qualityProfileId: number,
    rootFolderPath: string,
    monitored: boolean,
    searchNow: boolean
  }): Observable<any> {
    const missingParts = col.parts?.filter(p => !p.inLibrary) || [];

    if (missingParts.length === 0) {
      return of(true);
    }

    const observables = missingParts.map(part => {
      const payload = {
        title: part.title,
        tmdbId: part.id,
        qualityProfileId: config.qualityProfileId,
        rootFolderPath: config.rootFolderPath,
        monitored: config.monitored,
        searchOnAdd: config.searchNow,
        minimumAvailability: 'announced'
      };
      return this.radarrService.addMovie(config.serviceId, payload).pipe(
        map(res => {
          this.movieCache.add(part.id);
          return res;
        })
      );
    });

    return forkJoin(observables);
  }

  ensureLibraryCache(): Observable<void> {
    if (this.cacheInitialization$) {
      return this.cacheInitialization$;
    }

    this.cacheInitialization$ = this.servicesService.getServices().pipe(
      switchMap(services => {
        const radarr = services.find(s => s.type === ServiceType.RADARR);
        if (!radarr) return of(undefined);
        return this.radarrService.getMovies(radarr.id!);
      }),
      map(movies => {
        if (movies) {
          this.movieCache.clear();
          movies.forEach((m: any) => this.movieCache.add(m.tmdbId));
        }
      }),
      shareReplay(1)
    );

    return this.cacheInitialization$;
  }

  isMovieInLibrary(tmdbId: number): boolean {
    return this.movieCache.has(tmdbId);
  }

  // --- Unified Library & Smart Collections ---

  getLibraryItems(forceRefresh = false): Observable<LibraryItem[]> {
    if (this.libraryCache$ && !forceRefresh) {
      return this.libraryCache$;
    }

    this.libraryCache$ = this.servicesService.getServices().pipe(
      switchMap(services => {
        const requests = services.map(service => {
          if (service.type === ServiceType.RADARR) {
            return this.radarrService.getMovies(service.id!).pipe(
              map(movies => movies.map(m => ({
                uniqueId: `m-${m.tmdbId}`,
                type: 'movie' as const,
                title: m.title,
                year: m.year,
                overview: m.overview,
                tmdbId: m.tmdbId,
                posterUrl: m.images?.find((i: any) => i.coverType === 'poster')?.remoteUrl,
                rating: m.ratings?.tmdb?.value || m.ratings?.imdb?.value || 0,
                runtime: m.runtime,
                added: new Date(m.added),
                status: m.status,
                serviceId: service.id!
              }))),
              shareReplay(1)
            );
          } else if (service.type === ServiceType.SONARR) {
            return this.sonarrService.getSeries(service.id!).pipe(
              map(shows => shows.map(s => ({
                uniqueId: `s-${(s as any).tvdbId || s.id}`,
                type: 'show' as const,
                title: s.title,
                year: s.year,
                overview: s.overview,
                tmdbId: (s as any).tmdbId || 0,
                tvdbId: (s as any).tvdbId,
                posterUrl: s.images?.find((i: any) => i.coverType === 'poster')?.remoteUrl,
                rating: s.ratings?.tmdb?.value || s.ratings?.imdb?.value || s.ratings?.value || 0,
                seasons: s.seasonCount, // Assuming SonarrSeries has seasonCount or similar, need to verify
                added: new Date(s.added),
                status: s.status,
                serviceId: service.id!
              }))),
              shareReplay(1)
            );
          }
          return of([]);
        });

        return forkJoin(requests).pipe(
          map(results => results.flat().sort((a, b) => b.added.getTime() - a.added.getTime()))
        );
      }),
      shareReplay(1)
    );

    return this.libraryCache$;
  }

  getUnderrated(): Observable<LibraryItem[]> {
    return this.getLibraryItems().pipe(
      map(items => items.filter(i => {
        // High rating but not super new (to avoid hype skew) or just general "gems" logic
        // For now: Rating > 8.0
        return i.rating >= 8.0;
      }).sort(() => 0.5 - Math.random()).slice(0, 10)) // Random 10
    );
  }

  getMarathonWorthy(): Observable<LibraryItem[]> {
    return this.getLibraryItems().pipe(
      map(items => items.filter(i => {
        // Shows, > 3 seasons, Rating > 7.5
        return i.type === 'show' && (i.seasons || 0) >= 3 && i.rating >= 7.5;
      }).sort((a, b) => b.rating - a.rating).slice(0, 10))
    );
  }

  getQuickWatch(): Observable<LibraryItem[]> {
    return this.getLibraryItems().pipe(
      map(items => items.filter(i => {
        // Movies, < 100 mins, Rating > 6.0
        return i.type === 'movie' && (i.runtime || 0) > 0 && (i.runtime || 0) <= 100 && i.rating >= 6.0;
      }).sort((a, b) => b.rating - a.rating).slice(0, 10))
    );
  }
}
