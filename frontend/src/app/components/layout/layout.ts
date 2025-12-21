import {Component, inject, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AuthService} from '../../services/auth';
import {filter} from 'rxjs/operators';

import {GlobalSearchComponent, OpenDetailsEvent} from '../global-search/global-search.component';
import {DetailsModalComponent} from '../details-modal/details-modal.component';

import {AiChatWidgetComponent} from '../ai-chat-widget/ai-chat-widget.component';
import {SearchService} from '../../services/search.service';
import {TraktService} from '../../integrations/trakt/trakt.service';
import {ServicesService, ServiceType} from '../../services/services';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, GlobalSearchComponent, DetailsModalComponent, AiChatWidgetComponent],
  templateUrl: './layout.html',
  styles: ``
})
export class Layout {
  authService = inject(AuthService);
  searchService = inject(SearchService);
  router = inject(Router);
  traktService = inject(TraktService);
  servicesService = inject(ServicesService);
  isOpen = signal(false);

  @ViewChild(GlobalSearchComponent) globalSearch!: GlobalSearchComponent;

  traktServiceId?: number;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.isOpen.set(false);
    });

    this.servicesService.getServices().subscribe(services => {
      const trakt = services.find(s => s.type === ServiceType.TRAKT);
      if (trakt) this.traktServiceId = trakt.id;
    });

    this.searchService.eventEmitter.subscribe(event => {
      console.log('Search Event:', event);
      if (event.tmdbId) {
        this.openDetailsModal(event);
      } else {
        this.resolveAndOpen(event.title, event.year, event.type);
      }
    })
  }

  onSearchRequest(query: string) {
    this.globalSearch.onSearch(query);
  }

  logout() {
    this.authService.logout();
  }

  // Details Modal State
  detailsModalOpen = signal(false);
  detailsType: 'movie' | 'show' = 'movie';
  detailsTmdbId?: number;
  detailsTvdbId?: number;
  detailsTraktId?: number;
  detailsTraktServiceId?: number;

  resolveAndOpen(title: string, year: number, type: 'movie' | 'show') {
    if (!this.traktServiceId) {
      console.warn('Trakt service not configured, cannot resolve');
      return;
    }

    this.traktService.searchQuery(this.traktServiceId, title).subscribe({
      next: (results: any[]) => {
        // Filter by type and year (allow +/- 1 year fuzziness)
        const match = results.find((r: any) => {
          const item = r.movie || r.show;
          const rType = r.type === 'show' ? 'show' : 'movie';
          if (rType !== type) return false;
          if (!item.year) return false;
          return Math.abs(item.year - year) <= 1;
        });

        if (match) {
          const item = match.movie || match.show;
          this.openDetailsModal({
            type: type,
            tmdbId: item.ids.tmdb,
            traktId: item.ids.trakt,
            traktServiceId: this.traktServiceId
          });
        } else {
          // Fallback: just open search results? Or Toast?
          // For now trigger global search
          this.onSearchRequest(title);
        }
      },
      error: (err) => console.error('Resolution failed', err)
    });
  }

  openDetailsModal(event: any) {
    this.detailsType = event.type;
    this.detailsTmdbId = event.tmdbId;
    this.detailsTraktId = event.traktId; // might be undefined
    this.detailsTraktServiceId = this.traktServiceId;
    this.detailsModalOpen.set(true);
  }

  onOpenDetails(event: OpenDetailsEvent) {
    this.detailsType = event.type;
    this.detailsTmdbId = event.tmdbId;
    this.detailsTvdbId = event.tvdbId;
    this.detailsTraktId = event.traktId;
    this.detailsTraktServiceId = event.traktServiceId
    this.detailsModalOpen.set(true);
  }
}
