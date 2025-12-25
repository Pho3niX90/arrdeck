import {Component, computed, inject, Input, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {DetailsModalService} from '../../../services/details-modal.service';
import {MediaItem} from '../../../shared/models/media-item.model';
import {TraktService} from '../trakt.service';
import {RadarrDataService} from '../../radarr/radarr.data.service';
import {SonarrDataService} from '../../sonarr/sonarr.data.service';
import {ServicesService, ServiceType} from '../../../services/services';
import {TmdbImagePipe} from '../../../pipes/tmdb-image.pipe';
import {WidgetBase} from '../../../shared/base/widget-base';
import {HorizontalCardComponent} from '../../../shared/components/horizontal-card/horizontal-card.component';

interface UnifiedItem {
  ids: { tmdb?: number; tvdb?: number; trakt?: number };
  title: string;
  year?: number;
  poster: string;
  sources: Set<string>;
  added: Date;
  inLibrary: boolean;
  rating?: number;
  rawItem?: any;
}

@Component({
  selector: 'app-unified-recommendations',
  standalone: true,
  imports: [CommonModule, HorizontalCardComponent],
  providers: [TmdbImagePipe],
  templateUrl: './unified-recommendations.component.html',
  styles: ``
})
export class UnifiedRecommendationsComponent extends WidgetBase implements OnInit {
  @Input() type: 'movie' | 'show' = 'movie';

  private traktService = inject(TraktService);
  private radarrService = inject(RadarrDataService);
  private sonarrService = inject(SonarrDataService);
  private servicesService = inject(ServicesService);
  private tmdbImagePipe = inject(TmdbImagePipe);
  private detailsModalService = inject(DetailsModalService);

  loading = signal(true);

  private traktRecs = signal<any[]>([]);
  private serviceRecs = signal<any[]>([]);
  private libraryIds = signal<Set<number>>(new Set());

  items = computed(() => {
    const trakt = this.traktRecs();
    const service = this.serviceRecs();
    const library = this.libraryIds();

    return this.processResults(trakt, service, library);
  });

  ngOnInit() {
    this.loadData();
  }

  // ... (lines 63-207 skipped as unchanged logic)


  loadData() {
    this.loading.set(true);
    this.servicesService.getServices().subscribe(services => {
      const trakt = services.find(s => s.type === ServiceType.TRAKT);
      const radarr = services.find(s => s.type === ServiceType.RADARR);
      const sonarr = services.find(s => s.type === ServiceType.SONARR);

      if (trakt) {
        let traktObs: Observable<any[]>;
        if (this.type === 'movie') {
          traktObs = this.traktService.getRecommendedMovies(trakt.id!);
        } else {
          traktObs = this.traktService.getRecommendedShows(trakt.id!);
        }

        traktObs.pipe(catchError(() => of([]))).subscribe((data: any[]) => {
          this.traktRecs.set(data);
          this.checkLoading();
        });
      }

      if (this.type === 'movie' && radarr) {
        // Radarr doesn't have a recommendations endpoint, just load library to check collected status
        this.radarrService.loadMovies(radarr.id!).pipe(catchError(() => of([]))).subscribe(() => {
          const movies = this.radarrService.getMoviesForService(radarr.id!);
          const ids = new Set<number>();
          movies.forEach(m => {
            if (m.tmdbId) ids.add(m.tmdbId);
          });
          this.libraryIds.set(ids);
          this.checkLoading();
        });
      }

      if (this.type === 'show' && sonarr) {
        // Sonarr doesn't have a recommendations endpoint, just load library to check collected status
        this.sonarrService.loadSeries(sonarr.id!).pipe(catchError(() => of<any>([]))).subscribe(() => {
          const shows = this.sonarrService.getSeriesForService(sonarr.id!);
          const ids = new Set<number>();
          shows.forEach(s => {
            if (s.tvdbId) ids.add(s.tvdbId);
          });
          this.libraryIds.set(ids);
          this.checkLoading();
        });
      }

      if (!trakt) {
        this.loading.set(false);
      }
    });
  }

  private checkLoading() {
    this.loading.set(false);
  }

  processResults(traktRecs: any[], serviceRecs: any[], existingIds: Set<number>) {
    const aggregated = new Map<number, UnifiedItem>();

    if (Array.isArray(traktRecs)) {
      traktRecs.forEach((item: any) => {
        let id: number | undefined;
        let title = '';
        let poster = '';
        let year = 0;
        let raw: any;
        let isCollected = false;

        if (this.type === 'movie') {
          id = item.ids.tmdb;
          if (existingIds.has(id!)) isCollected = true;
          title = item.title;
          year = item.year;
          poster = this.extractPoster(item.images);
          raw = item;
        } else {
          const tvdb = item.ids.tvdb;
          const tmdb = item.ids.tmdb;

          if (tvdb && existingIds.has(tvdb)) isCollected = true;

          id = tvdb || tmdb;
          title = item.title;
          year = item.year;
          poster = this.extractPoster(item.images);
          raw = item;
        }

        if (!id || isCollected) return;

        if (!aggregated.has(id)) {
          aggregated.set(id, {
            ids: item.ids,
            title,
            year,
            poster,
            sources: new Set(['Trakt']),
            added: new Date(),
            inLibrary: false,
            rating: item.rating ? item.rating * 1 : undefined, // Ensure number
            rawItem: raw
          });
        } else {
          aggregated.get(id)!.sources.add('Trakt');
        }
      });
    }

    if (Array.isArray(serviceRecs)) {
      serviceRecs.forEach((item: any) => {
        let id: number | undefined;
        if (this.type === 'movie') {
          id = item.tmdbId;
        } else {
          id = item.tvdbId;
        }

        if (!id) return;

        if (existingIds.has(id)) return;
        const inLib = item.id && item.id > 0;
        if (inLib) return;

        if (!aggregated.has(id)) {
          aggregated.set(id, {
            ids: this.type === 'movie' ? {tmdb: item.tmdbId} : {tvdb: item.tvdbId},
            title: item.title,
            year: item.year,
            poster: this.ensureProtocol(item.remotePoster || item.images?.find((i: any) => i.coverType === 'poster')?.remoteUrl),
            sources: new Set([this.type === 'movie' ? 'Radarr' : 'Sonarr']),
            added: new Date(),
            inLibrary: false,
            rating: item.ratings?.tmdb?.value || item.ratings?.imdb?.value,
            rawItem: item
          });
        } else {
          aggregated.get(id)!.sources.add(this.type === 'movie' ? 'Radarr' : 'Sonarr');
        }
      });
    }

    return Array.from(aggregated.values())
      .sort((a, b) => b.sources.size - a.sources.size)
      .map(u => this.mapToMediaItem(u));
  }

  mapToMediaItem(item: UnifiedItem): MediaItem {
    let badgeText = 'Trakt';
    let badgeColor = 'bg-red-600/80 text-white';

    if (item.sources.has('Radarr') && !item.sources.has('Trakt')) {
      badgeText = 'Radarr';
      badgeColor = 'bg-amber-600/80 text-white';
    } else if (item.sources.has('Sonarr') && !item.sources.has('Trakt')) {
      badgeText = 'Sonarr';
      badgeColor = 'bg-emerald-600/80 text-white';
    } else if (item.sources.size > 1) {
      badgeText = 'Multi';
      badgeColor = 'bg-blue-600/80 text-white';
    }

    return {
      id: item.ids.tmdb || item.ids.tvdb || 0,
      title: item.title,
      subtitle: item.year?.toString(), // Keeping as subtitle? Plan said Bottom Center.
      imageUrl: this.tmdbImagePipe.transform(this.ensureProtocol(item.poster), 'w190'),
      clickAction: () => {
        this.detailsModalService.open({
          type: this.type,
          traktId: item.ids.trakt,
          tmdbId: item.ids.tmdb,
          tvdbId: item.ids.tvdb
        });
      },
      accentColor: this.type === 'movie' ? 'text-amber-400' : 'text-emerald-400',
      bottomLeftBadge: {
        text: badgeText,
        colorClass: badgeColor + ' font-bold text-[10px]'
      },
      topRightBadge: item.rating ? {
        text: item.rating.toFixed(1),
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-amber-500/80 text-white'
      } : undefined,
      bottomCenterOverlay: item.year ? {
        text: item.year.toString(),
        location: 'bottom'
      } : undefined
    };
  }

  extractPoster(images: any) {
    if (!images) return '';
    const url = images.poster?.[0] || images.poster?.full || images.poster?.medium || '';
    return this.ensureProtocol(url);
  }

  private ensureProtocol(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('http') && !url.startsWith('https')) {
      return 'https://' + url;
    }
    return url;
  }

  getTraktIcon() {
    return `<svg viewBox="0 0 24 24" fill="#ED1C24" class="w-full h-full"><circle cx="12" cy="12" r="10"/></svg>`;
  }

  getRadarrIcon() {
    return `<svg viewBox="0 0 24 24" fill="#fbbf24" class="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`;
  }

  getSonarrIcon() {
    return `<svg viewBox="0 0 24 24" fill="#34ad9b" class="w-full h-full"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8-8 8z"/></svg>`;
  }
}
