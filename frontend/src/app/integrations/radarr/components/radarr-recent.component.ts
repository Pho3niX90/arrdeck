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

    return {
      id: movie.id,
      title: movie.title,
      imageUrl: this.tmdbImagePipe.transform(poster, 'w185'),
      clickAction: () => this.openDetails(movie),
      accentColor: 'text-amber-400',
      topRightBadge: movie.ratings?.value ? {
        text: movie.ratings.value.toFixed(1),
        colorClass: 'bg-black/70 text-white'
      } : undefined,
      bottomOverlay: {
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
