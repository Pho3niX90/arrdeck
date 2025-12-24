import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TraktService} from '../trakt.service';
import {TraktShow} from '../trakt.models';
import {WidgetCardComponent} from '../../../components/widget-card/widget-card.component';
import {DetailsModalService} from '../../../services/details-modal.service';
import {SonarrService} from '../../sonarr/sonarr.service';
import {ServicesService, ServiceType} from '../../../services/services';
import {MediaCarouselComponent} from '../../../shared/components/media-carousel/media-carousel.component';
import {MediaItem} from '../../../shared/models/media-item.model';

import {WidgetBase} from '../../../shared/base/widget-base';

@Component({
  selector: 'app-trakt-recommended-shows',
  standalone: true,
  imports: [CommonModule, MediaCarouselComponent, WidgetCardComponent],
  templateUrl: './trakt-recommended-shows.component.html',
  styles: ``
})
export class TraktRecommendedShowsComponent extends WidgetBase implements OnInit {

  private traktService = inject(TraktService);
  private servicesService = inject(ServicesService);
  private sonarrService = inject(SonarrService);
  private detailsModalService = inject(DetailsModalService);

  shows = signal<TraktShow[]>([]);
  libraryIds = signal<Set<number>>(new Set());

  mediaItems = computed<MediaItem[]>(() => {
    return this.shows().map(show => this.mapToMediaItem(show));
  });

  ngOnInit() {
    this.traktService.getRecommendedShows(this.serviceId()).subscribe(shows => {
      this.shows.set(shows);
      this.checkLibrary();
    });
  }

  private mapToMediaItem(show: TraktShow): MediaItem {
    return {
      id: show.ids.trakt,
      title: show.title,
      subtitle: show.year?.toString(),
      imageUrl: this.getPoster(show),
      accentColor: 'text-amber-400',
      clickAction: () => this.openDetails(show),
      topRightBadge: undefined,
      topLeftBadge: this.isInLibrary(show) ? { // In Library
        text: undefined,
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-green-500/80 text-white'
      } : undefined,
      bottomOverlay: {
        location: 'center',
        text: show.rating ? `★ ${(show.rating * 10).toFixed(0)}%` : undefined
      }
    };
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
    this.detailsModalService.open({
      traktId: show.ids.trakt,
      tmdbId: show.ids.tmdb,
      tvdbId: show.ids.tvdb,
      type: 'show'
    });
  }

  checkLibrary() {
    this.servicesService.getServices().subscribe(services => {
      const sonarr = services.find(s => s.type === ServiceType.SONARR);
      if (sonarr && sonarr.id) {
        this.sonarrService.getSeries(sonarr.id).subscribe(librarySeries => {
          const ids = new Set(librarySeries.map(s => s.tvdbId).filter((id): id is number => !!id));
          this.libraryIds.set(ids);
        });
      }
    });
  }

  isInLibrary(show: TraktShow): boolean {
    return !!show.ids.tvdb && this.libraryIds().has(show.ids.tvdb);
  }
}
