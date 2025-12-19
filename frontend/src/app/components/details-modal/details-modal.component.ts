import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraktService } from '../../integrations/trakt/trakt.service';
import { TmdbService } from '../../integrations/tmdb/tmdb.service';
import { RadarrService } from '../../integrations/radarr/radarr.service';
import { SonarrService } from '../../integrations/sonarr/sonarr.service';
import { ServicesService, ServiceType } from '../../services/services';
import { AddMediaModalComponent } from '../add-media-modal/add-media-modal.component';
import { TraktMovie, TraktShow } from '../../integrations/trakt/trakt.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-details-modal',
  standalone: true,
  imports: [CommonModule, AddMediaModalComponent],
  templateUrl: './details-modal.component.html',
  styles: ``
})
export class DetailsModalComponent {
  @Input() traktServiceId?: number;
  @Input() type: 'movie' | 'show' = 'movie';
  @Input() traktId?: number;
  @Input() tmdbId?: number;
  @Input() tvdbId?: number;

  @Output() close = new EventEmitter<void>();

  private traktService = inject(TraktService);
  private tmdbService = inject(TmdbService);
  private servicesService = inject(ServicesService);
  private radarrService = inject(RadarrService);
  private sonarrService = inject(SonarrService);

  isOpen = false;
  loading = signal(true);

  details = signal<any>(null);
  people = signal<any>(null);

  // Library Status
  inLibrary = signal(false);
  checkingLibrary = signal(false);

  // Add Modal
  showAddModal = false;

  // TMDB Config
  private tmdbServiceId?: number;

  open() {
    this.isOpen = true;
    this.loading.set(true);
    this.details.set(null);
    this.people.set(null);
    this.inLibrary.set(false);

    // Get Services to find TMDB and others
    this.servicesService.getServices().subscribe(services => {
      const tmdb = services.find(s => s.type === ServiceType.TMDB);
      if (tmdb) this.tmdbServiceId = tmdb.id;
      else this.tmdbServiceId = undefined;

      const trakt = services.find(s => s.type === ServiceType.TRAKT);
      if (trakt) this.traktServiceId = trakt.id;

      this.resolveAndFetch();
    });
  }

  private resolveAndFetch() {
    if (this.tmdbServiceId) {
      if (this.tmdbId) {
        this.fetchDetails();
        this.checkLibraryWithId(this.tmdbId);
      } else if (this.tvdbId && this.type === 'show' && this.traktServiceId) {
        this.traktService.search(this.traktServiceId, 'tvdb', this.tvdbId.toString(), 'show')
          .subscribe((results: any[]) => {
            if (results && results.length > 0 && results[0].show) {
              this.tmdbId = results[0].show.ids.tmdb;
              this.traktId = results[0].show.ids.trakt;
              this.fetchDetails();
              if (this.tmdbId) this.checkLibraryWithId(this.tmdbId);
            } else {
              console.warn('ID Resolution failed for TMDB');
              this.loading.set(false);
            }
          }, () => this.loading.set(false));
      } else if (this.traktId && this.traktServiceId) {
        if (this.type === 'movie') {
          this.traktService.getMovie(this.traktServiceId, this.traktId).subscribe((res: TraktMovie) => {
            this.handleTraktResolution(res);
          }, () => this.loading.set(false));
        } else {
          this.traktService.getShow(this.traktServiceId, this.traktId).subscribe((res: TraktShow) => {
            this.handleTraktResolution(res);
          }, () => this.loading.set(false));
        }
      } else {
        console.error('Insufficient info for TMDB fetch');
        this.loading.set(false);
      }
    }
    else if (this.traktServiceId && (this.traktId || this.tmdbId || this.tvdbId)) {
      if (this.traktId) {
        this.fetchDetailsTrakt();
        if (this.tmdbId) this.checkLibraryWithId(this.tmdbId);
      } else if (this.tmdbId && this.type === 'movie') {
        this.traktService.search(this.traktServiceId, 'tmdb', this.tmdbId.toString(), 'movie').subscribe(res => {
          if (res[0]?.movie) {
            this.traktId = res[0].movie.ids.trakt;
            this.fetchDetailsTrakt();
            this.checkLibraryWithId(this.tmdbId!);
          }
        });
      } else if (this.tvdbId && this.type === 'show') {
        this.traktService.search(this.traktServiceId, 'tvdb', this.tvdbId.toString(), 'show').subscribe(res => {
          if (res[0]?.show) {
            this.traktId = res[0].show.ids.trakt;
            this.tmdbId = res[0].show.ids.tmdb;
            this.fetchDetailsTrakt();
            if (this.tmdbId) this.checkLibraryWithId(this.tmdbId!);
          }
        });
      } else if (this.tmdbId && this.type === 'show') {
        this.traktService.search(this.traktServiceId, 'tmdb', this.tmdbId.toString(), 'show').subscribe(res => {
          if (res[0]?.show) {
            this.traktId = res[0].show.ids.trakt;
            if (!this.tmdbId) this.tmdbId = res[0].show.ids.tmdb;

            this.fetchDetailsTrakt();
            if (this.tmdbId) this.checkLibraryWithId(this.tmdbId);
          } else {
            // Fallback: If Trakt search fails, we're stuck.
            this.loading.set(false);
          }
        }, err => this.loading.set(false));
      }
    } else {
      console.error('No Metadata Service Available (TMDB or Trakt)');
      this.loading.set(false);
    }
  }

  private handleTraktResolution(res: TraktMovie | TraktShow) {
    this.tmdbId = res.ids.tmdb;
    if (this.tmdbId) {
      this.fetchDetails();
      this.checkLibraryWithId(this.tmdbId);
    } else {
      console.warn('No TMDB ID found for this item via Trakt');
      this.processTraktData(res);
      this.fetchTraktPeople();
      this.loading.set(false);
    }
  }

  onClose() {
    this.isOpen = false;
    this.close.emit();
    this.details.set(null);
    this.people.set(null);
    this.inLibrary.set(false);
    this.traktId = undefined;
    this.tmdbId = undefined;
    this.tvdbId = undefined;
  }

  fetchDetails() {
    if (this.tmdbServiceId && this.tmdbId) {
      if (this.type === 'movie') {
        this.tmdbService.getMovie(this.tmdbServiceId, this.tmdbId).subscribe(data => {
          this.processTmdbData(data);
          this.loading.set(false);
        }, err => this.loading.set(false));
      } else {
        this.tmdbService.getTv(this.tmdbServiceId, this.tmdbId).subscribe(data => {
          this.processTmdbData(data);
          this.loading.set(false);
        }, err => this.loading.set(false));
      }
    }
  }

  fetchDetailsTrakt() {
    if (!this.traktServiceId || !this.traktId) return;

    if (this.type === 'movie') {
      this.traktService.getMovie(this.traktServiceId, this.traktId).subscribe((data: TraktMovie) => {
        this.processTraktData(data);
        if (data.ids.tmdb) {
          this.tmdbId = data.ids.tmdb;
          this.checkLibraryWithId(this.tmdbId);
        }
        this.loading.set(false);
      });
    } else {
      this.traktService.getShow(this.traktServiceId, this.traktId).subscribe((data: TraktShow) => {
        this.processTraktData(data);
        if (data.ids.tmdb) {
          this.tmdbId = data.ids.tmdb;
          this.checkLibraryWithId(this.tmdbId);
        }
        this.loading.set(false);
      });
    }

    this.fetchTraktPeople();
  }

  fetchTraktPeople() {
    if (!this.traktServiceId || !this.traktId) return;
    const obs = this.type === 'movie'
      ? this.traktService.getMoviePeople(this.traktServiceId, this.traktId)
      : this.traktService.getShowPeople(this.traktServiceId, this.traktId);

    obs.subscribe(data => {
      this.people.set(data);
    });
  }

  processTmdbData(data: any) {
    const normalized = {
      title: data.title || data.name,
      year: new Date(data.release_date || data.first_air_date).getFullYear(),
      overview: data.overview,
      runtime: data.runtime || (data.episode_run_time?.length ? data.episode_run_time[0] : 0),
      rating: data.vote_average,
      genres: data.genres?.map((g: any) => g.name) || [],
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      certification: null,
      ids: { tmdb: data.id }
    };
    this.details.set(normalized);

    if (data.credits) {
      const mappedCast = data.credits.cast.slice(0, 20).map((c: any) => ({
        person: {
          name: c.name,
          ids: { tmdb: c.id }
        },
        character: c.character,
        profile_path: c.profile_path
      }));
      this.people.set({ cast: mappedCast });
    }
  }

  processTraktData(data: any) {
    this.details.set(data);
  }

  checkLibraryWithId(tmdbId: number) {
    this.checkingLibrary.set(true);
    this.servicesService.getServices().subscribe(services => {
      const targetType = this.type === 'movie' ? ServiceType.RADARR : ServiceType.SONARR;
      const service = services.find(s => s.type === targetType);

      if (!service) {
        this.checkingLibrary.set(false);
        return;
      }

      const term = `tmdb:${tmdbId}`;
      if (this.type === 'movie') {
        this.radarrService.lookup(service.id!, term).subscribe(results => {
          const match = results.find(m => m.tmdbId === tmdbId);
          if (match && match.id) this.inLibrary.set(true);
          this.checkingLibrary.set(false);
        });
      } else {
        this.sonarrService.lookup(service.id!, term).subscribe(results => {
          const match = results.find(s => s.tmdbId === tmdbId);
          if (match && match.id) this.inLibrary.set(true);
          this.checkingLibrary.set(false);
        });
      }
    });
  }

  getPoster() {
    const d = this.details();
    if (!d) return '';

    if (d.poster_path) return `https://image.tmdb.org/t/p/w500${d.poster_path}`;

    const images = d.images;
    if (images) {
      const poster = images.poster;
      let url = '';
      if (Array.isArray(poster)) url = poster[0];
      else if (poster && typeof poster === 'object') url = poster.medium || poster.full;
      else if (typeof poster === 'string') url = poster;
      return this.ensureProtocol(url);
    }
    return '';
  }

  getBackdrop() {
    const d = this.details();
    if (!d) return '';

    if (d.backdrop_path) return `https://image.tmdb.org/t/p/original${d.backdrop_path}`;

    const images = d.images;
    if (images) {
      const fanart = images.fanart;
      let url = '';
      if (Array.isArray(fanart)) url = fanart[0];
      else if (fanart && typeof fanart === 'object') url = fanart.full || fanart.medium;
      else if (typeof fanart === 'string') url = fanart;
      return this.ensureProtocol(url);
    }
    return '';
  }

  getHeadshot(person: any): string {
    if (person.profile_path) return `https://image.tmdb.org/t/p/w185${person.profile_path}`;

    const images = person.person?.images || person.images;
    if (images) {
      const headshot = images.headshot;
      let url = '';
      if (Array.isArray(headshot)) url = headshot[0];
      else if (headshot && typeof headshot === 'object') url = headshot.thumb || headshot.medium || headshot.full;
      else if (typeof headshot === 'string') return headshot;
      return this.ensureProtocol(url);
    }
    return '';
  }

  private ensureProtocol(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (!url.startsWith('http') && !url.startsWith('https')) {
      return 'https://' + url;
    }
    return url;
  }
}
