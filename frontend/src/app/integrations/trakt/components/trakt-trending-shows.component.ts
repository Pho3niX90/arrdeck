import {Component, computed, inject, Input, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TraktService} from '../trakt.service';
import {TraktShow, TraktTrendingItem} from '../trakt.models';
import {WidgetCardComponent} from '../../../components/widget-card/widget-card.component';
import {DetailsModalComponent} from '../../../components/details-modal/details-modal.component';
import {SonarrService} from '../../sonarr/sonarr.service';
import {ServicesService} from '../../../services/services';
import {MediaCarouselComponent} from '../../../shared/components/media-carousel/media-carousel.component';
import {MediaItem} from '../../../shared/models/media-item.model';

@Component({
  selector: 'app-trakt-trending-shows',
  standalone: true,
  imports: [CommonModule, WidgetCardComponent, DetailsModalComponent, MediaCarouselComponent],
  templateUrl: './trakt-trending-shows.component.html',
  styles: ``
})
export class TraktTrendingShowsComponent implements OnInit {
  @Input({required: true}) serviceId!: number;

  @ViewChild(DetailsModalComponent) detailsModal!: DetailsModalComponent;

  private traktService = inject(TraktService);
  private servicesService = inject(ServicesService);
  private sonarrService = inject(SonarrService);

  shows = signal<TraktTrendingItem<TraktShow>[]>([]);
  libraryIds = signal<Set<number>>(new Set());

  mediaItems = computed<MediaItem[]>(() => {
    return this.shows().map(item => this.mapToMediaItem(item));
  });

  ngOnInit() {
    this.traktService.getTrendingShows(this.serviceId).subscribe(data => {
      this.shows.set(data);
    });
    this.checkLibrary();
  }

  private mapToMediaItem(item: TraktTrendingItem<TraktShow>): MediaItem {
    const show = item.show!;
    return {
      id: show.ids.trakt,
      title: show.title,
      subtitle: show.year?.toString(),
      imageUrl: this.getPoster(show),
      accentColor: 'text-red-500',
      clickAction: () => this.openDetails(show),
      topRightBadge: { // Watchers
        text: item.watchers.toString(),
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 text-red-500"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-black/70 backdrop-blur-sm text-white font-bold border border-white/10'
      },
      topLeftBadge: this.isInLibrary(show) ? { // In Library
        text: undefined,
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-green-500/80 text-white'
      } : undefined
    };
  }

  checkLibrary() {
    this.servicesService.getServices().subscribe(services => {
      const sonarr = services.find(s => s.type === 'sonarr');
      if (sonarr) {
        this.sonarrService.getSeries(sonarr.id!).subscribe(shows => {
          const ids = new Set<number>();
          shows.forEach(s => {
            if (s.tvdbId) ids.add(s.tvdbId);
          });
          this.libraryIds.set(ids);
        });
      }
    });
  }

  isInLibrary(show: TraktShow): boolean {
    const tvdb = show.ids.tvdb;
    return !!tvdb && this.libraryIds().has(tvdb);
  }

  getPoster(show: TraktShow): string {
    const images: any = show.images;
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

  openDetails(show: TraktShow) {
    this.detailsModal.traktServiceId = this.serviceId;
    this.detailsModal.type = 'show';
    this.detailsModal.traktId = show.ids.trakt;
    this.detailsModal.open();
  }
}
