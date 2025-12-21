import {Component, EventEmitter, inject, OnInit, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SonarrService} from '../../integrations/sonarr/sonarr.service';
import {RadarrService} from '../../integrations/radarr/radarr.service';
import {TraktService} from '../../integrations/trakt/trakt.service';
import {ServiceConfig, ServicesService, ServiceType} from '../../services/services';
import {catchError, debounceTime, distinctUntilChanged, forkJoin, map, of, Subject, switchMap, tap} from 'rxjs';
import {Router} from '@angular/router';
import {TmdbImagePipe} from '../../pipes/tmdb-image.pipe';

export interface OpenDetailsEvent {
  type: 'movie' | 'show';
  tmdbId?: number;
  tvdbId?: number;
  traktId?: number;
  traktServiceId?: number;
}

interface SearchResult {
  id: number | string;
  title: string;
  year?: number;
  overview?: string;
  image?: string;
  type: 'movie' | 'series';
  source: 'sonarr' | 'radarr' | 'trakt';
  inLibrary: boolean;
  serviceId?: number; // Config service ID
}

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [TmdbImagePipe],
  templateUrl: './global-search.component.html',
  styles: `
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #374151;
      border-radius: 4px;
    }
  `
})
export class GlobalSearchComponent implements OnInit {
  private servicesService = inject(ServicesService);
  private sonarr = inject(SonarrService);
  private radarr = inject(RadarrService);
  private trakt = inject(TraktService);
  private router = inject(Router);
  private tmdbImagePipe = inject(TmdbImagePipe);

  searchQuery = signal('');
  results = signal<SearchResult[]>([]);
  loading = signal(false);
  showResults = signal(false);

  // Store services locally
  services = signal<ServiceConfig[]>([]);

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(term => {
        if (term.length > 2) {
          this.loading.set(true);
          this.showResults.set(true);
        } else {
          this.results.set([]);
          this.showResults.set(false);
        }
      }),
      switchMap(term => {
        if (!term || term.length <= 2) return of([]);
        return this.performSearch(term).pipe(
          catchError(err => {
            console.error(err);
            this.loading.set(false);
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      this.results.set(results);
      this.loading.set(false);
    });
  }

  // Modal Output
  @Output() openDetails = new EventEmitter<OpenDetailsEvent>();

  traktServiceId?: number;

  ngOnInit() {
    // Load services on init
    this.servicesService.getServices().subscribe(s => {
      this.services.set(s);
      const trakt = s.find(svc => svc.type === ServiceType.TRAKT);
      if (trakt) this.traktServiceId = trakt.id;
    });
  }

  onSearch(term: string) {
    this.searchQuery.set(term);
    this.searchSubject.next(term);
  }

  performSearch(term: string) {
    const services = this.services();

    const tasks: any[] = [];

    // Find configured services
    const sonarrServices = services.filter((s: ServiceConfig) => s.type === ServiceType.SONARR);
    const radarrServices = services.filter((s: ServiceConfig) => s.type === ServiceType.RADARR);
    const traktService = services.find((s: ServiceConfig) => s.type === ServiceType.TRAKT);

    // Add Sonarr Lookups
    sonarrServices.forEach((s: ServiceConfig) => {
      tasks.push(this.sonarr.lookup(s.id!, term).pipe(
        map((res: any[]) => res.map((item: any) => ({
          id: item.tvdbId,
          title: item.title,
          year: item.year,
          overview: item.overview,
          image: this.tmdbImagePipe.transform(item.remotePoster, 'w185'), // Sonarr returns remotePoster
          type: 'series',
          source: 'sonarr',
          inLibrary: !!item.path, // If path exists, it's likely in library or monitored
          serviceId: s.id
        }))),
        catchError(() => of([]))
      ));
    });

    // Add Radarr Lookups
    radarrServices.forEach((s: ServiceConfig) => {
      tasks.push(this.radarr.lookup(s.id!, term).pipe(
        map((res: any[]) => res.map((item: any) => ({
          id: item.tmdbId,
          title: item.title,
          year: item.year,
          overview: item.overview,
          image: this.tmdbImagePipe.transform(item.remotePoster, 'w185'),
          type: 'movie',
          source: 'radarr',
          inLibrary: !!item.path,
          serviceId: s.id
        }))),
        catchError(() => of([]))
      ));
    });

    // Add Trakt Search
    if (traktService) {
      tasks.push(this.trakt.searchQuery(traktService.id!, term).pipe(
        map((res: any[]) => res.map((item: any) => {
          const type = item.type; // movie or show
          const data = item[type];
          return {
            id: data.ids.trakt,
            title: data.title,
            year: data.year,
            overview: data.overview,
            image: null,
            type: type === 'show' ? 'series' : 'movie',
            source: 'trakt',
            inLibrary: false,
            serviceId: traktService.id
          };
        })),
        catchError(() => of([]))
      ));
    }

    return forkJoin(tasks).pipe(
      map(resultsArray => {
        // Flatten results
        const allResults = resultsArray.flat() as SearchResult[];
        // Deduplicate logic
        const uniqueResults = new Map<string, SearchResult>();

        allResults.forEach(r => {
          const key = `${r.type}-${r.title}-${r.year}`;
          if (!uniqueResults.has(key)) {
            uniqueResults.set(key, r);
          } else {
            // Update if current is not in library but new one is
            const existing = uniqueResults.get(key)!;
            if (!existing.inLibrary && r.inLibrary) {
              uniqueResults.set(key, r);
            }
          }
        });

        return Array.from(uniqueResults.values());
      })
    );
  }

  // Helpers for template
  libraryResults() {
    return this.results().filter(r => r.inLibrary);
  }

  hasLibraryResults() {
    return this.libraryResults().length > 0;
  }

  discoverResults() {
    return this.results().filter(r => !r.inLibrary);
  }

  hasDiscoverResults() {
    return this.discoverResults().length > 0;
  }

  selectRec(result: SearchResult) {
    console.log('Selected result', result);
    this.closeResults();

    const type = result.type === 'series' ? 'show' : 'movie';
    const id = Number(result.id);

    let tmdbId: number | undefined;
    let tvdbId: number | undefined;
    let traktId: number | undefined;

    if (result.source === 'radarr') {
      tmdbId = id;
    } else if (result.source === 'sonarr') {
      tvdbId = id;
    } else if (result.source === 'trakt') {
      traktId = id;
    }

    this.openDetails.emit({
      type,
      tmdbId,
      tvdbId,
      traktId,
      traktServiceId: this.traktServiceId
    });
  }

  closeResults() {
    this.showResults.set(false);
  }
}
