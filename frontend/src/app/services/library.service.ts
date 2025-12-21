import {inject, Injectable} from '@angular/core';
import {firstValueFrom, forkJoin, map, Observable, of, switchMap} from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private servicesService = inject(ServicesService);
  private radarrService = inject(RadarrService);
  private sonarrService = inject(SonarrService);

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

  private movieCache = new Set<number>();
  private cacheInitialized = false;

  async ensureLibraryCache() {
    if (this.cacheInitialized) return;

    const services = await firstValueFrom(this.servicesService.getServices());
    const radarr = services.find(s => s.type === ServiceType.RADARR);
    if (radarr) {
      this.radarrService.getMovies(radarr.id!).subscribe({
        next: (movies) => {
          this.movieCache.clear();
          movies.forEach(m => this.movieCache.add(m.tmdbId));
          this.cacheInitialized = true;
        },
        error: (e) => console.error('Failed to load Radarr cache', e)
      });
    }
  }

  isMovieInLibrary(tmdbId: number): boolean {
    return this.movieCache.has(tmdbId);
  }
}
