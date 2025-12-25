import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RadarrDataService} from '../radarr.data.service';
import {RadarrMovie} from '../radarr.models';
import {MediaItem} from '../../../shared/models/media-item.model';
import {TimeAgoPipe} from '../../../pipes/time-ago.pipe';
import {DetailsModalService} from '../../../services/details-modal.service';

import {TmdbImagePipe} from '../../../pipes/tmdb-image.pipe';

import {WidgetBase} from '../../../shared/base/widget-base';
import {HorizontalCardComponent} from '../../../shared/components/horizontal-card/horizontal-card.component';

@Component({
  selector: 'app-radarr-recent',
  standalone: true,
  imports: [CommonModule, HorizontalCardComponent],
  providers: [TimeAgoPipe, TmdbImagePipe],
  templateUrl: './radarr-recent.component.html',
  styles: ``
})
export class RadarrRecentComponent extends WidgetBase implements OnInit {

  private dataService = inject(RadarrDataService);
  private timeAgoPipe = inject(TimeAgoPipe);
  private tmdbImagePipe = inject(TmdbImagePipe);
  private detailsModalService = inject(DetailsModalService);

  movies = signal<RadarrMovie[]>([]);

  mediaItems = computed<MediaItem[]>(() => {
    return this.movies().map(movie => this.mapToMediaItem(movie));
  });

  ngOnInit() {
    this.dataService.loadMovies(this.serviceId()).subscribe(() => {
      const allMovies = this.dataService.getMoviesForService(this.serviceId());
      const sorted = allMovies.sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());
      this.movies.set(sorted.slice(0, Math.min(50, sorted.length)));
    });
  }

  private mapToMediaItem(movie: RadarrMovie): MediaItem {
    const poster = movie.images.find(i => i.coverType === 'poster')?.remoteUrl || '';
    const rating = movie.ratings?.tmdb?.value || movie.ratings?.imdb?.value;

    return {
      id: movie.id,
      title: movie.title,
      imageUrl: this.tmdbImagePipe.transform(poster, 'w185'),
      clickAction: () => this.openDetails(movie),
      accentColor: 'text-amber-400',
      topRightBadge: rating ? {
        text: rating.toFixed(1),
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-amber-500/80 text-white'
      } : undefined,
      bottomLeftBadge: {
        text: 'Radarr',
        colorClass: 'bg-amber-600/80 text-white font-bold text-[10px]'
      },
      bottomCenterOverlay: {
        text: this.timeAgoPipe.transform(movie.added),
        location: 'bottom'
      }
    };
  }

  openDetails(movie: RadarrMovie) {
    this.detailsModalService.open({
      type: 'movie',
      tmdbId: movie.tmdbId
    });
  }
}
