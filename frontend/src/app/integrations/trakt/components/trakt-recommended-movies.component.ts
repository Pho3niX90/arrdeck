import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TraktService} from '../trakt.service';
import {TraktMovie} from '../trakt.models';
import {DetailsModalService} from '../../../services/details-modal.service';
import {RadarrService} from '../../radarr/radarr.service';
import {ServicesService, ServiceType} from '../../../services/services';
import {MediaItem} from '../../../shared/models/media-item.model';

import {WidgetBase} from '../../../shared/base/widget-base';
import {HorizontalCardComponent} from '../../../shared/components/horizontal-card/horizontal-card.component';

@Component({
  selector: 'app-trakt-recommended-movies',
  standalone: true,
  imports: [CommonModule, HorizontalCardComponent],
  templateUrl: './trakt-recommended-movies.component.html',
  styles: ``
})
export class TraktRecommendedMoviesComponent extends WidgetBase implements OnInit {

  private traktService = inject(TraktService);
  private servicesService = inject(ServicesService);
  private radarrService = inject(RadarrService);
  private detailsModalService = inject(DetailsModalService);

  movies = signal<TraktMovie[]>([]);
  libraryIds = signal<Set<number>>(new Set());

  mediaItems = computed<MediaItem[]>(() => {
    return this.movies().map(movie => this.mapToMediaItem(movie));
  });

  ngOnInit() {
    this.traktService.getRecommendedMovies(this.serviceId()).subscribe(movies => {
      this.movies.set(movies);
      this.checkLibrary();
    });
  }

  private mapToMediaItem(movie: TraktMovie): MediaItem {
    return {
      id: movie.ids.trakt,
      title: movie.title,
      subtitle: movie.year?.toString(),
      imageUrl: this.getPoster(movie),
      accentColor: 'text-amber-400',
      clickAction: () => this.openDetails(movie),
      topRightBadge: undefined,
      topLeftBadge: this.isInLibrary(movie) ? {
        text: undefined,
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-green-500/80 text-white'
      } : undefined,
      bottomOverlay: {
        location: 'center',
        text: movie.rating ? `★ ${(movie.rating * 10).toFixed(0)}%` : undefined
      }
    };
  }

  getPoster(movie: TraktMovie): string {
    const images: any = movie.images;
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
      tmdbId: movie.ids.tmdb,
      traktId: movie.ids.trakt,
      type: 'movie'
    });
  }

  checkLibrary() {
    this.servicesService.getServices().subscribe(services => {
      const radarr = services.find(s => s.type === ServiceType.RADARR);
      if (radarr && radarr.id) {
        this.radarrService.getMovies(radarr.id).subscribe(libraryMovies => {
          const ids = new Set(libraryMovies.map(m => m.tmdbId).filter(id => !!id));
          this.libraryIds.set(ids);
        });
      }
    });
  }

  isInLibrary(movie: TraktMovie): boolean {
    return this.libraryIds().has(movie.ids.tmdb);
  }
}
