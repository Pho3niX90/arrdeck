import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SonarrDataService} from '../sonarr.data.service';
import {SonarrSeries} from '../sonarr.models';
import {MediaItem} from '../../../shared/models/media-item.model';
import {TimeAgoPipe} from '../../../pipes/time-ago.pipe';
import {DetailsModalService} from '../../../services/details-modal.service';

import {TmdbImagePipe} from '../../../pipes/tmdb-image.pipe';

import {WidgetBase} from '../../../shared/base/widget-base';
import {HorizontalCardComponent} from '../../../shared/components/horizontal-card/horizontal-card.component';

@Component({
  selector: 'app-sonarr-recent',
  standalone: true,
  imports: [CommonModule, HorizontalCardComponent],
  providers: [TimeAgoPipe, TmdbImagePipe],
  templateUrl: './sonarr-recent.component.html',
  styles: ``
})
export class SonarrRecentComponent extends WidgetBase implements OnInit {

  private dataService = inject(SonarrDataService);
  private timeAgoPipe = inject(TimeAgoPipe);
  private tmdbImagePipe = inject(TmdbImagePipe);
  private detailsModalService = inject(DetailsModalService);

  shows = signal<SonarrSeries[]>([]);

  mediaItems = computed<MediaItem[]>(() => {
    return this.shows().map(show => this.mapToMediaItem(show));
  });

  ngOnInit() {
    this.dataService.loadSeries(this.serviceId()).subscribe(() => {
      const allSeries = this.dataService.getSeriesForService(this.serviceId());
      const sorted = allSeries.sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());
      this.shows.set(sorted.slice(0, 15));
    });
  }

  private mapToMediaItem(show: SonarrSeries): MediaItem {
    const poster = show.images.find(i => i.coverType === 'poster')?.remoteUrl || '';

    const rating = show.ratings?.tmdb?.value || show.ratings?.imdb?.value || show.ratings?.value;

    return {
      id: show.id,
      title: show.title,
      imageUrl: this.tmdbImagePipe.transform(poster, 'w185'),
      clickAction: () => this.openDetails(show),
      accentColor: 'text-emerald-400',
      topRightBadge: rating ? {
        text: rating.toFixed(1),
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-amber-500/80 text-white'
      } : undefined,
      bottomLeftBadge: {
        text: 'Sonarr',
        colorClass: 'bg-emerald-600/80 text-white font-bold text-[10px]'
      },
      bottomCenterOverlay: {
        text: this.timeAgoPipe.transform(show.added),
        location: 'bottom'
      }
    };
  }

  openDetails(show: SonarrSeries) {
    this.detailsModalService.open({
      type: 'show',
      tvdbId: show.tvdbId
    });
  }
}
