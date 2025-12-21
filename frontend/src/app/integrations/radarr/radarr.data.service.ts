import { Injectable, inject, signal } from '@angular/core';
import { RadarrService } from './radarr.service';
import { RadarrMovie } from './radarr.models';
import { tap, shareReplay, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RadarrDataService {
    private radarrService = inject(RadarrService);

    private moviesCache = new Map<number, RadarrMovie[]>();
    private recommendationsCache = new Map<number, RadarrMovie[]>();

    loadMovies(serviceId: number) {
        if (this.moviesCache.has(serviceId)) {
            return new Date().getTime() ? this.radarrService.getMovies(serviceId).pipe(
                tap(movies => this.moviesCache.set(serviceId, movies)),
                shareReplay(1)
            ) : this.radarrService.getMovies(serviceId);
        }

        return this.radarrService.getMovies(serviceId).pipe(
            tap(movies => this.moviesCache.set(serviceId, movies)),
            shareReplay(1)
        );
    }

    getMoviesForService(serviceId: number): RadarrMovie[] {
        return this.moviesCache.get(serviceId) || [];
    }

    getQueue(serviceId: number) {
        return this.radarrService.getQueue(serviceId);
    }
}
