import { Component, EventEmitter, inject, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesService, ServiceType } from '../../services/services';
import { RadarrService } from '../../integrations/radarr/radarr.service';
import { SonarrService } from '../../integrations/sonarr/sonarr.service';
import { FileSizePipe } from '../../pipes/file-size.pipe';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-add-media-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FileSizePipe],
  templateUrl: './add-media-modal.component.html'
})
export class AddMediaModalComponent implements OnInit {
  @Input() type: 'movie' | 'show' = 'movie';
  @Input() tmdbId!: number;
  @Input() title!: string;
  @Input() year!: number;
  @Input() mode: 'add' | 'configure' = 'add';

  @Output() added = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() configure = new EventEmitter<any>();

  private servicesService = inject(ServicesService);
  private radarrService = inject(RadarrService);
  private sonarrService = inject(SonarrService);
  private messageService = inject(MessageService);

  isOpen = false;
  isAdding = signal(false);

  availableServices = signal<any[]>([]);
  selectedServiceId = signal<number | null>(null);

  profiles = signal<any[]>([]);
  rootFolders = signal<any[]>([]);

  selectedRootFolder: string = '';
  selectedProfileId: number | null = null;
  monitored = true;
  searchNow = true;

  ngOnInit() {
    this.open();
  }

  open() {
    this.isOpen = true;
    this.loadServices();
  }

  close() {
    this.isOpen = false;
    this.cancelled.emit();
  }

  loadServices() {
    this.servicesService.getServices().subscribe(services => {
      const targetType = this.type === 'movie' ? ServiceType.RADARR : ServiceType.SONARR;
      const filtered = services.filter(s => s.type === targetType);
      this.availableServices.set(filtered);

      if (filtered.length > 0) {
        const savedServiceId = localStorage.getItem(`arrdeck_last_service_${this.type}`);
        const found = filtered.find(s => s.id === Number(savedServiceId));
        this.selectedServiceId.set(found ? found.id! : filtered[0].id!);
        this.onServiceChange();
      }
    });
  }

  onServiceChange() {
    const id = this.selectedServiceId();
    if (!id) return;

    if (this.type === 'movie') {
      this.radarrService.getProfiles(id).subscribe(p => {
        this.profiles.set(p);
        const savedProfile = localStorage.getItem(`arrdeck_last_profile_${this.type}`);
        const found = p.find((fp: any) => fp.id === Number(savedProfile));
        if (p.length) this.selectedProfileId = found ? found.id : p[0].id;
      });
      this.radarrService.getRootFolders(id).subscribe(f => {
        this.rootFolders.set(f);
        const savedRoot = localStorage.getItem(`arrdeck_last_root_${this.type}`);
        const found = f.find((fp: any) => fp.path === savedRoot);
        if (f.length) this.selectedRootFolder = found ? found.path : f[0].path;
      });
    } else {
      this.sonarrService.getProfiles(id).subscribe(p => {
        this.profiles.set(p);
        const savedProfile = localStorage.getItem(`arrdeck_last_profile_${this.type}`);
        const found = p.find((fp: any) => fp.id === Number(savedProfile));
        if (p.length) this.selectedProfileId = found ? found.id : p[0].id;
      });
      this.sonarrService.getRootFolders(id).subscribe(f => {
        this.rootFolders.set(f);
        const savedRoot = localStorage.getItem(`arrdeck_last_root_${this.type}`);
        const found = f.find((fp: any) => fp.path === savedRoot);
        if (f.length) this.selectedRootFolder = found ? found.path : f[0].path;
      });
    }
  }

  canAdd(): boolean {
    return !!this.selectedServiceId() && !!this.selectedProfileId && !!this.selectedRootFolder && !this.isAdding();
  }

  saveSettings() {
    if (this.selectedServiceId()) localStorage.setItem(`arrdeck_last_service_${this.type}`, this.selectedServiceId()!.toString());
    if (this.selectedProfileId) localStorage.setItem(`arrdeck_last_profile_${this.type}`, this.selectedProfileId.toString());
    if (this.selectedRootFolder) localStorage.setItem(`arrdeck_last_root_${this.type}`, this.selectedRootFolder);
  }

  add() {
    if (!this.canAdd()) return;
    this.isAdding.set(true);

    const serviceId = this.selectedServiceId()!;
    const term = `tmdb:${this.tmdbId}`;

    if (this.mode === 'configure') {
      this.configure.emit({
        serviceId,
        qualityProfileId: this.selectedProfileId,
        rootFolderPath: this.selectedRootFolder,
        monitored: this.monitored,
        searchNow: this.searchNow
      });
      this.saveSettings();
      this.finish();
      return;
    }

    if (this.type === 'movie') {
      this.radarrService.lookup(serviceId, term).subscribe({
        next: results => {
          const match = results.find(m => m.tmdbId === this.tmdbId);
          if (match) {
            const payload = {
              ...match,
              qualityProfileId: this.selectedProfileId,
              rootFolderPath: this.selectedRootFolder,
              monitored: this.monitored,
              addOptions: { searchForMovie: this.searchNow }
            };
            this.radarrService.addMovie(serviceId, payload).subscribe({
              next: () => {
                this.saveSettings();
                this.finish();
              },
              error: (err) => {
                console.error('Error adding movie to Radarr:', err);
                this.messageService.show(`Failed to add movie: ${err.message || 'Unknown error'}`, 'error');
                this.isAdding.set(false);
              }
            });
          } else {
            console.warn('Radarr lookup returned no match for TMDB:', this.tmdbId, results);
            this.isAdding.set(false);
            this.messageService.show('Could not find movie in Radarr lookup. Check logs.', 'error');
          }
        },
        error: (err) => {
          console.error('Error searching Radarr:', err);
          this.isAdding.set(false);
          this.messageService.show(`Error searching Radarr: ${err.message}`, 'error');
        }
      })
    } else {
      this.sonarrService.lookup(serviceId, term).subscribe({
        next: results => {
          const match = results.find(s => s.tmdbId === this.tmdbId);
          if (match) {
            const payload = {
              ...match,
              qualityProfileId: this.selectedProfileId,
              rootFolderPath: this.selectedRootFolder,
              monitored: this.monitored,
              addOptions: { searchForMissingEpisodes: this.searchNow },
              seasonFolder: true
            };
            this.sonarrService.addSeries(serviceId, payload).subscribe({
              next: () => {
                this.saveSettings();
                this.finish();
              },
              error: (err) => {
                console.error('Error adding series to Sonarr:', err);
                this.messageService.show(`Failed to add series: ${err.message || 'Unknown error'}`, 'error');
                this.isAdding.set(false);
              }
            });
          } else {
            console.warn('Sonarr lookup returned no match for TMDB:', this.tmdbId, results);
            this.isAdding.set(false);
            if (results.length > 0) {
              this.messageService.show(`Found ${results.length} results but TMDB ID didn't match. First: ${results[0].title} (${results[0].tmdbId})`, 'error');
            } else {
              this.messageService.show('Could not find series in Sonarr lookup.', 'error');
            }
          }
        },
        error: (err) => {
          console.error('Error searching Sonarr:', err);
          this.isAdding.set(false);
          this.messageService.show(`Error searching Sonarr: ${err.message}`, 'error');
        }
      });
    }
  }

  finish() {
    this.isAdding.set(false);
    this.added.emit();
    this.close();
  }
}
