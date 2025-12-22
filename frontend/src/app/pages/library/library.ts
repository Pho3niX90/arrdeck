import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ServiceConfig, ServicesService, ServiceType} from '../../services/services';
import {SonarrService} from '../../integrations/sonarr/sonarr.service';
import {RadarrService} from '../../integrations/radarr/radarr.service';
import {catchError, forkJoin, map, of} from 'rxjs';
import {DetailsModalComponent} from '../../components/details-modal/details-modal.component';

export interface LibraryItem {
  uniqueId: string; // type-id
  type: 'movie' | 'show';
  title: string;
  year: number;
  overview: string;
  tmdbId: number;
  tvdbId?: number;
  posterUrl?: string;
  rating: number;
  added: Date;
  status: string;
  serviceId: number;
}

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, DetailsModalComponent],
  templateUrl: './library.html',
  styles: ``
})
export class LibraryPage {
  private servicesService = inject(ServicesService);
  private sonarrService = inject(SonarrService);
  private radarrService = inject(RadarrService);

  services = signal<ServiceConfig[]>([]);
  items = signal<LibraryItem[]>([]);
  loading = signal(true);

  // Filters
  filterType = signal<'all' | 'movie' | 'show'>('all');
  searchQuery = signal('');
  sortBy = signal<'added' | 'title' | 'year' | 'rating'>('added');

  detailsModal = signal<{ type: 'movie' | 'show', tmdbId: number, tvdbId?: number } | null>(null);

  constructor() {
    this.loadLibrary();
  }

  loadLibrary() {
    this.loading.set(true);
    this.servicesService.getServices().subscribe(services => {
      this.services.set(services);

      const requests = services.map(service => {
        if (service.type === ServiceType.RADARR) {
          return this.radarrService.getMovies(service.id!).pipe(
            map(movies => movies.map(m => ({
              uniqueId: `m-${m.tmdbId}`,
              type: 'movie' as const,
              title: m.title,
              year: m.year,
              overview: m.overview,
              tmdbId: m.tmdbId,
              posterUrl: m.images?.find(i => i.coverType === 'poster')?.remoteUrl,
              rating: m.ratings?.value || 0,
              added: new Date(m.added),
              status: m.status,
              serviceId: service.id!
            }))),
            catchError(err => {
              console.error(`Failed to load Radarr ${service.name}`, err);
              return of([]);
            })
          );
        } else if (service.type === ServiceType.SONARR) {
          return this.sonarrService.getSeries(service.id!).pipe(
            map(shows => shows.map(s => ({
              uniqueId: `s-${(s as any).tvdbId || s.id}`,
              type: 'show' as const,
              title: s.title,
              year: s.year,
              overview: s.overview,
              tmdbId: (s as any).tmdbId || 0, // Sonarr v4 has tmdbId usually
              tvdbId: (s as any).tvdbId,
              posterUrl: s.images?.find(i => i.coverType === 'poster')?.remoteUrl,
              rating: s.ratings?.value || 0,
              added: new Date(s.added),
              status: s.status,
              serviceId: service.id!
            }))),
            catchError(err => {
              console.error(`Failed to load Sonarr ${service.name}`, err);
              return of([]);
            })
          );
        }
        return of([]);
      });

      forkJoin(requests).subscribe(results => {
        const allItems = results.flat().sort((a, b) => b.added.getTime() - a.added.getTime());
        this.items.set(allItems);
        this.loading.set(false);
      });
    });
  }

  filteredItems = computed(() => {
    let result = this.items();
    const q = this.searchQuery().toLowerCase();
    const t = this.filterType();
    const sort = this.sortBy();

    // Type Filter
    if (t !== 'all') {
      result = result.filter(i => i.type === t);
    }

    // Search
    if (q) {
      result = result.filter(i => i.title.toLowerCase().includes(q));
    }

    // Sort
    result = [...result].sort((a, b) => { // Create copy to not mutate signal source if it was ref
      switch (sort) {
        case 'added':
          return b.added.getTime() - a.added.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return b.year - a.year;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return result;
  });

  openDetails(item: LibraryItem) {
    this.detailsModal.set({
      type: item.type,
      tmdbId: item.tmdbId,
      tvdbId: item.tvdbId
    });
  }
}
