import { Component, Input, OnInit, inject, signal, computed, ViewChild, AfterViewInit, OnDestroy, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraktService } from '../trakt.service';
import { TraktTrendingItem, TraktMovie } from '../trakt.models';
import { WidgetCardComponent } from '../../../components/widget-card/widget-card.component';
import { DetailsModalComponent } from '../../../components/details-modal/details-modal.component';
import { RadarrService } from '../../radarr/radarr.service';
import { ServicesService } from '../../../services/services';
import { MediaCarouselComponent } from '../../../shared/components/media-carousel/media-carousel.component';
import { MediaItem } from '../../../shared/models/media-item.model';

@Component({
  selector: 'app-trakt-trending-movies',
  standalone: true,
  imports: [CommonModule, WidgetCardComponent, DetailsModalComponent, MediaCarouselComponent],
  templateUrl: './trakt-trending-movies.component.html',
  styles: ``
})
export class TraktTrendingMoviesComponent implements OnInit {
  @Input({ required: true }) serviceId!: number;

  @ViewChild(DetailsModalComponent) detailsModal!: DetailsModalComponent;

  private traktService = inject(TraktService);
  private servicesService = inject(ServicesService);
  private radarrService = inject(RadarrService);

  movies = signal<TraktTrendingItem<TraktMovie>[]>([]);
  libraryIds = signal<Set<number>>(new Set());

  mediaItems = computed<MediaItem[]>(() => {
    return this.movies().map(item => this.mapToMediaItem(item));
  });

  ngOnInit() {
    this.traktService.getTrendingMovies(this.serviceId).subscribe(data => {
      this.movies.set(data);
    });

    this.checkLibrary();
  }

  private mapToMediaItem(item: TraktTrendingItem<TraktMovie>): MediaItem {
    const movie = item.movie!;
    return {
      id: movie.ids.trakt,
      title: movie.title,
      subtitle: movie.year?.toString(),
      imageUrl: this.getPoster(movie),
      accentColor: 'text-red-500',
      clickAction: () => this.openDetails(movie),
      topRightBadge: {
        text: item.watchers.toString(),
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 text-red-500"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-black/70 backdrop-blur-sm text-white font-bold border border-white/10'
      },
      topLeftBadge: this.isInLibrary(movie) ? {
        text: undefined,
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-green-500/80 text-white'
      } : undefined
    };
  }

  checkLibrary() {
    this.servicesService.getServices().subscribe(services => {
      const radarr = services.find(s => s.type === 'radarr');
      if (radarr) {
        this.radarrService.getMovies(radarr.id!).subscribe(movies => {
          const ids = new Set(movies.map(m => m.tmdbId).filter(id => !!id));
          this.libraryIds.set(ids);
        });
      }
    });
  }

  isInLibrary(movie: TraktMovie): boolean {
    return this.libraryIds().has(movie.ids.tmdb);
  }

  getPoster(movie: TraktMovie): string {
    const images = movie.images;
    if (!images) return '';

    let url = '';
    const poster = images.poster;

    if (Array.isArray(poster)) {
      url = poster[0];
    } else if (poster && typeof poster === 'object') {
      url = poster.thumb || poster.medium || poster.full;
    } else if (typeof poster === 'string') {
      url = poster;
    }

    if (url && !url.startsWith('http')) {
      return `https://${url}`;
    }
    return url || '';
  }

  openDetails(movie: TraktMovie) {
    this.detailsModal.traktServiceId = this.serviceId;
    this.detailsModal.type = 'movie';
    this.detailsModal.traktId = movie.ids.trakt;
    this.detailsModal.open();
  }
}
