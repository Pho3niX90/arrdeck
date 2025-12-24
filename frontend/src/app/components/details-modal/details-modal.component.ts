import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {take} from 'rxjs';
import {TmdbService} from '../../integrations/tmdb/tmdb.service';
import {ServicesService, ServiceType} from '../../services/services';
import {AddMediaModalComponent} from '../add-media-modal/add-media-modal.component';
import {MetadataService, NormalizedDetails} from '../../services/metadata.service';
import {LibraryService, LibraryStatus} from '../../services/library.service';
import {MessageService} from '../../services/message.service';
import {TmdbCollection, TmdbCredits, TmdbItem} from '../../integrations/tmdb/tmdb.models';
import {JellyfinService} from '../../integrations/jellyfin/jellyfin.service';
import {DetailsModalService} from '../../services/details-modal.service';

import {TmdbImagePipe} from '../../pipes/tmdb-image.pipe';

@Component({
  selector: 'app-details-modal',
  standalone: true,
  imports: [CommonModule, AddMediaModalComponent, TmdbImagePipe],
  templateUrl: './details-modal.component.html',
  styles: ``
})
export class DetailsModalComponent implements OnInit {

  private tmdbService = inject(TmdbService);
  private servicesService = inject(ServicesService);
  private metadataService = inject(MetadataService);
  private libraryService = inject(LibraryService);
  private jellyfinService = inject(JellyfinService);
  private messageService = inject(MessageService);
  private modalService = inject(DetailsModalService);

  isOpen = false;
  loading = signal(true);

  // Local state mirrored from service for logic
  type: 'movie' | 'show' = 'movie';
  tmdbId?: number;
  traktId?: number;
  tvdbId?: number;

  details = signal<NormalizedDetails | null>(null);
  people = signal<TmdbCredits | null>(null);
  recommendations = signal<TmdbItem[]>([]);
  similar = signal<TmdbItem[]>([]);

  // Season / Episode Data
  expandedSeason = signal<number | null>(null);
  seasonEpisodes = signal<Record<number, any[]>>({});
  loadingSeason = signal<number | null>(null);

  // Library Status
  inLibrary = signal(false);
  checkingLibrary = signal(false);
  sonarrEpisodes = signal<Record<number, Set<number>>>({});
  collectionInfo = signal<TmdbCollection | null>(null); // { name: string, tmdbId: number, images: ... }
  expandedCollection = signal(false);

  // Jellyfin
  jellyfinUrl = signal<string | null>(null);
  jellyfinItemId = signal<string | null>(null);
  checkingJellyfin = signal(false);

  // Add Modal
  showAddModal = false;

  // TMDB Config
  private tmdbServiceId?: number;

  constructor() {
    effect(() => {
      const state = this.modalService.state();
      if (state.isOpen) {
        // Only trigger open if different or previously closed
        if (!this.isOpen || state.tmdbId !== this.tmdbId || state.traktId !== this.traktId) {
          this.type = state.type;
          this.tmdbId = state.tmdbId;
          this.traktId = state.traktId;
          this.tvdbId = state.tvdbId;
          this.open();
        }
      } else {
        this.isOpen = false;
        // Reset local data on close logic handled in onClose but UI might just behave.
      }
    });
  }

  ngOnInit() {
    this.libraryService.ensureLibraryCache().subscribe();
    this.servicesService.getServices().subscribe(services => {
      const tmdb = services.find(s => s.type === ServiceType.TMDB);
      if (tmdb) this.tmdbServiceId = tmdb.id;

      const jellyfin = services.find(s => s.type === ServiceType.JELLYFIN);
      if (jellyfin) {
        this.jellyfinUrl.set(jellyfin.url);
        // Store apiKey in a signal if needed or just use it in check
        this.jellyfinApiKey = jellyfin.apiKey;
      }
    });
  }

  private jellyfinApiKey = '';

  open() {
    this.isOpen = true;
    this.loading.set(true);
    this.details.set(null);
    this.people.set(null);
    this.recommendations.set([]);
    this.similar.set([]);
    this.inLibrary.set(false);
    this.sonarrEpisodes.set({});
    this.collectionInfo.set(null);
    this.jellyfinItemId.set(null);
    this.resolveAndFetch();
  }

  private resolveAndFetch() {
    console.log(`resolveAndFetch`);
    const ids = {
      tmdb: this.tmdbId,
      trakt: this.traktId,
      tvdb: this.tvdbId
    };

    this.metadataService.resolveAndFetch(ids, this.type).subscribe({
      next: (details) => {
        this.details.set(details);
        this.loading.set(false);

        // Update IDs based on resolved details
        if (details.ids.tmdb) this.tmdbId = details.ids.tmdb;
        if (details.ids.trakt) this.traktId = details.ids.trakt;
        if (details.ids.tvdb) this.tvdbId = details.ids.tvdb;

        if (details.collection?.id) {
          this.fetchCollectionDetails(details.collection.id);
        }

        if (this.tmdbId) {
          console.log(`USING TMDB ID ${this.tmdbId} for library check`)
          this.checkLibraryWithId(this.tmdbId);
        }

        // People fetching still mostly separate depending on source
        if (this.tmdbServiceId && this.tmdbId) {
          console.log(`USING TMDB ID ${this.tmdbId} for credits fetching`)
          this.fetchTmdbCredits();
        }

        if (this.jellyfinUrl() && this.jellyfinApiKey) {
          this.checkJellyfin(details.title, details.year);
        }
      },
      error: (err) => {
        console.error('Failed to resolve/fetch details', err);
        this.loading.set(false);
      }
    });
  }

  onClose() {
    this.modalService.close(); // Signal close to service
    // Local cleanup
    this.isOpen = false;
    this.details.set(null);
    this.people.set(null);
    this.inLibrary.set(false);
    this.traktId = undefined;
    this.tmdbId = undefined;
    this.tvdbId = undefined;
  }

  fetchTmdbCredits() {
    if (!this.tmdbServiceId || !this.tmdbId) return;
    const obs = this.type === 'movie'
      ? this.tmdbService.getMovieCredits(this.tmdbServiceId, this.tmdbId)
      : this.tmdbService.getTvCredits(this.tmdbServiceId, this.tmdbId);

    obs.subscribe(data => {
      this.people.set(data);
    });

    const recObs = this.type === 'movie'
      ? this.tmdbService.getMovieRecommendations(this.tmdbServiceId, this.tmdbId)
      : this.tmdbService.getTvRecommendations(this.tmdbServiceId, this.tmdbId);

    recObs.subscribe(data => {
      this.recommendations.set(data.results);
    });

    const simObs = this.type === 'movie'
      ? this.tmdbService.getMovieSimilar(this.tmdbServiceId, this.tmdbId)
      : this.tmdbService.getTvSimilar(this.tmdbServiceId, this.tmdbId);

    simObs.subscribe(data => {
      this.similar.set(data.results);
    });
  }

  fetchCollectionDetails(collectionId: number) {
    if (!this.tmdbServiceId) return;
    this.tmdbService.getCollection(this.tmdbServiceId, collectionId).subscribe(data => {
      const tmdbData: any = {...data, tmdbId: data.id};
      delete tmdbData.id;

      if (tmdbData.parts) {
        tmdbData.parts = tmdbData.parts.map((p: any) => ({
          ...p,
          inLibrary: this.libraryService.isMovieInLibrary(p.id)
        }));

        // Count library items
        tmdbData.libraryCount = tmdbData.parts.filter((p: any) => p.inLibrary).length;
        tmdbData.monitored = tmdbData.libraryCount === tmdbData.parts.length;
      }

      this.collectionInfo.set(tmdbData);
      this.expandedCollection.set(true);
    });
  }

  toggleSeason(seasonNumber: number) {
    if (this.expandedSeason() === seasonNumber) {
      this.expandedSeason.set(null);
      return;
    }

    this.expandedSeason.set(seasonNumber);

    // Check if we already have episodes
    const currentEpisodes = this.seasonEpisodes();
    if (currentEpisodes[seasonNumber]) {
      return;
    }

    // Fetch episodes
    this.loadingSeason.set(seasonNumber);
    // Use legacy fetch for season episodes for now, as MetadataService logic for seasons is partial
    // Ideally MetadataService should handle this too.

    if (this.tmdbServiceId && this.tmdbId) {
      this.tmdbService.getSeason(this.tmdbServiceId!, this.tmdbId, seasonNumber).subscribe({
        next: (data) => {
          this.seasonEpisodes.update(current => ({
            ...current,
            [seasonNumber]: data.episodes || []
          }));
          this.loadingSeason.set(null);
        },
        error: () => {
          this.loadingSeason.set(null);
        }
      });
    }
  }

  switchToItem(tmdbId: number, type?: 'movie' | 'show') {
    this.modalService.open({
      tmdbId,
      type: type || (this.type as 'movie' | 'show') // cast safely or default
    });
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }

  checkLibraryWithId(tmdbId: number) {
    this.checkingLibrary.set(true);
    this.libraryService.checkLibrary(this.type, tmdbId, this.tvdbId).subscribe({
      next: (status: LibraryStatus) => {
        if (status.inLibrary) this.inLibrary.set(true);
        if (status.collectionTmdbId) this.fetchCollectionDetails(status.collectionTmdbId);
        if (status.images) {
          this.details.update(d => d ? ({...d, images: status.images}) : null);
        }
        if (status.sonarrEpisodes) {
          this.sonarrEpisodes.set(status.sonarrEpisodes);
        }
        this.checkingLibrary.set(false);
      },
      error: (e) => {
        console.error('Library check failed', e);
        this.checkingLibrary.set(false);
      }
    });
  }

  isDownloaded(season: number, episode: number): boolean {
    const map = this.sonarrEpisodes();
    return map[season]?.has(episode) || false;
  }

  getSeasonStatus(seasonNumber: number, totalEpisodes: number): 'full' | 'partial' | 'none' {
    const downloadedCount = this.sonarrEpisodes()[seasonNumber]?.size || 0;
    if (downloadedCount === 0) return 'none';
    if (downloadedCount >= totalEpisodes) return 'full';
    return 'partial';
  }


  showCollectionAddModal = false;

  openCollectionAddModal() {
    this.showCollectionAddModal = true;
  }

  performAddCollection(config: any) {
    const col = this.collectionInfo();
    if (!col) return;

    this.showCollectionAddModal = false;

    this.libraryService.addCollection(col, config).subscribe({
      next: () => {
        this.messageService.show('Collection movies added to Radarr queue', 'success');
        this.collectionInfo.update(c => c ? {...c, monitored: true} : null);
        this.fetchCollectionDetails(col.tmdbId!); // Refresh to show In Library status
      },
      error: (err) => {
        console.error('Failed to save collection', err);
        this.messageService.show('Failed to save collection. Check console.', 'error');
      }
    });
  }


  checkJellyfin(title: string, year?: number) {
    this.checkingJellyfin.set(true);
    // Simple search query: title
    // We can refine later
    this.jellyfinService.search(this.jellyfinUrl()!, this.jellyfinApiKey, title).pipe(take(1)).subscribe({
      next: (items) => {
        // Try to find exact match
        const match = items.find(i => {
          if (i.Type.toLowerCase() !== (this.type === 'show' ? 'series' : 'movie')) return false;
          // Optional year check
          if (year && i.ProductionYear && i.ProductionYear !== year) return false;
          return i.Name.toLowerCase() === title.toLowerCase();
        });

        if (match) {
          this.jellyfinItemId.set(match.Id);
        }
        this.checkingJellyfin.set(false);
      },
      error: (err) => {
        console.error('Failed to search Jellyfin', err);
        this.checkingJellyfin.set(false);
      }
    })
  }

  openInJellyfin() {
    if (this.jellyfinUrl() && this.jellyfinItemId()) {
      const url = this.jellyfinService.getDeepLink(this.jellyfinUrl()!, this.jellyfinItemId()!);
      window.open(url, '_blank');
    }
  }
}
