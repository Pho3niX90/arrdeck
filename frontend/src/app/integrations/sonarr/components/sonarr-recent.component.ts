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

    return {
      id: show.id,
      title: show.title,
      imageUrl: this.tmdbImagePipe.transform(poster, 'w185'),
      clickAction: () => this.openDetails(show),
      accentColor: 'text-emerald-400',
      topRightBadge: show.ratings?.value ? {
        text: show.ratings.value.toFixed(1),
        colorClass: 'bg-black/70 text-white'
      } : undefined,
      bottomOverlay: {
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
