import { Component, Input, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SonarrDataService } from '../sonarr.data.service';
import { SonarrSeries } from '../sonarr.models';
import { WidgetCardComponent } from '../../../components/widget-card/widget-card.component';
import { MediaCarouselComponent } from '../../../shared/components/media-carousel/media-carousel.component';
import { MediaItem } from '../../../shared/models/media-item.model';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { DetailsModalComponent } from '../../../components/details-modal/details-modal.component';

@Component({
  selector: 'app-sonarr-recent',
  standalone: true,
  imports: [CommonModule, WidgetCardComponent, MediaCarouselComponent, DetailsModalComponent],
  providers: [TimeAgoPipe],
  templateUrl: './sonarr-recent.component.html',
  styles: ``
})
export class SonarrRecentComponent implements OnInit {
  @Input({ required: true }) serviceId!: number;

  @ViewChild(DetailsModalComponent) detailsModal!: DetailsModalComponent;

  private dataService = inject(SonarrDataService);
  private timeAgoPipe = inject(TimeAgoPipe);

  shows = signal<SonarrSeries[]>([]);

  mediaItems = computed<MediaItem[]>(() => {
    return this.shows().map(show => this.mapToMediaItem(show));
  });

  ngOnInit() {
    this.dataService.loadSeries(this.serviceId).subscribe(() => {
      const allSeries = this.dataService.getSeriesForService(this.serviceId);
      const sorted = allSeries.sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());
      this.shows.set(sorted.slice(0, 15));
    });
  }

  private mapToMediaItem(show: SonarrSeries): MediaItem {
    const poster = show.images.find(i => i.coverType === 'poster')?.remoteUrl || '';

    return {
      id: show.id,
      title: show.title,
      imageUrl: poster,
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
    this.detailsModal.type = 'show';
    // Sonarr has tvdbId.
    this.detailsModal.tvdbId = show.tvdbId;
    this.detailsModal.open();
  }
}
