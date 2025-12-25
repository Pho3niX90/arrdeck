import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TraktService} from '../trakt.service';
import {TraktMovie, TraktTrendingItem} from '../trakt.models';
import {DetailsModalService} from '../../../services/details-modal.service';
import {RadarrService} from '../../radarr/radarr.service';
import {ServicesService} from '../../../services/services';
import {MediaItem} from '../../../shared/models/media-item.model';

import {WidgetBase} from '../../../shared/base/widget-base';
import {HorizontalCardComponent} from '../../../shared/components/horizontal-card/horizontal-card.component';

@Component({
  selector: 'app-trakt-trending-movies',
  standalone: true,
  imports: [CommonModule, HorizontalCardComponent],
  templateUrl: './trakt-trending-movies.component.html',
  styles: ``
})
export class TraktTrendingMoviesComponent extends WidgetBase implements OnInit {

  private traktService = inject(TraktService);
  private servicesService = inject(ServicesService);
  private radarrService = inject(RadarrService);
  private detailsModalService = inject(DetailsModalService);

  movies = signal<TraktTrendingItem<TraktMovie>[]>([]);
  libraryIds = signal<Set<number>>(new Set());

  mediaItems = computed<MediaItem[]>(() => {
    return this.movies().map(item => this.mapToMediaItem(item));
  });

  ngOnInit() {
    this.traktService.getTrendingMovies(this.serviceId()).subscribe(data => {
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
      topRightBadge: movie.rating ? {
        text: movie.rating.toFixed(1),
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-amber-500/80 text-white'
      } : undefined,
      bottomLeftBadge: {
        text: 'Trakt',
        colorClass: 'bg-red-600/80 text-white font-bold text-[10px]'
      },
      bottomCenterOverlay: movie.year ? {
        text: movie.year.toString(),
        location: 'bottom'
      } : undefined,
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
    this.detailsModalService.open({
      traktId: movie.ids.trakt,
      tmdbId: movie.ids.tmdb,
      type: 'movie'
    });
  }
}
