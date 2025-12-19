import { Component, EventEmitter, inject, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesService, ServiceType } from '../../services/services';
import { RadarrService } from '../../integrations/radarr/radarr.service';
import { SonarrService } from '../../integrations/sonarr/sonarr.service';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-add-media-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FileSizePipe],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="close()"></div>

        <div class="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6">
          <h2 class="text-xl font-bold text-white">Add to Library</h2>

          <div class="space-y-4">
            <!-- Service Selection -->
            <div class="space-y-2">
              <label class="text-sm text-slate-400">Select Service</label>
              <select [(ngModel)]="selectedServiceId" (change)="onServiceChange()"
                      class="w-full bg-slate-800 border-slate-700 rounded-lg text-white px-3 py-2">
                @for (s of availableServices(); track s.id) {
                  <option [value]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>

            <!-- Root Folder -->
            <div class="space-y-2">
              <label class="text-sm text-slate-400">Root Folder</label>
              <select [(ngModel)]="selectedRootFolder"
                      class="w-full bg-slate-800 border-slate-700 rounded-lg text-white px-3 py-2">
                @for (folder of rootFolders(); track folder.path) {
                  <option [value]="folder.path">{{ folder.path }}
                    ({{ folder.freeSpace | fileSize }})
                  </option>
                }
              </select>
            </div>

            <!-- Quality Profile -->
            <div class="space-y-2">
              <label class="text-sm text-slate-400">Quality Profile</label>
              <select [(ngModel)]="selectedProfileId"
                      class="w-full bg-slate-800 border-slate-700 rounded-lg text-white px-3 py-2">
                @for (profile of profiles(); track profile.id) {
                  <option [value]="profile.id">{{ profile.name }}</option>
                }
              </select>
            </div>

            <!-- Checkbox for Monitoring (default true) -->
            <div class="flex items-center gap-2">
              <input type="checkbox" id="monitored" [(ngModel)]="monitored"
                     class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500">
              <label for="monitored" class="text-sm text-white">Monitor</label>
            </div>

            <!-- Search on Add (default true) -->
            <div class="flex items-center gap-2">
              <input type="checkbox" id="searchNow" [(ngModel)]="searchNow"
                     class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500">
              <label for="searchNow" class="text-sm text-white">Search on Add</label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button (click)="close()" class="px-4 py-2 text-slate-300 hover:text-white transition">Cancel</button>
            <button (click)="add()" [disabled]="!canAdd()"
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isAdding() ? 'Adding...' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AddMediaModalComponent implements OnInit {
  @Input() type: 'movie' | 'show' = 'movie';
  @Input() tmdbId!: number;
  @Input() title!: string;
  @Input() year!: number;

  @Output() added = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private servicesService = inject(ServicesService);
  private radarrService = inject(RadarrService);
  private sonarrService = inject(SonarrService);

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
        this.selectedServiceId.set(filtered[0].id!);
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
        if (p.length) this.selectedProfileId = p[0].id;
      });
      this.radarrService.getRootFolders(id).subscribe(f => {
        this.rootFolders.set(f);
        if (f.length) this.selectedRootFolder = f[0].path;
      });
    } else {
      this.sonarrService.getProfiles(id).subscribe(p => {
        this.profiles.set(p);
        if (p.length) this.selectedProfileId = p[0].id;
      });
      this.sonarrService.getRootFolders(id).subscribe(f => {
        this.rootFolders.set(f);
        if (f.length) this.selectedRootFolder = f[0].path;
      });
    }
  }

  canAdd(): boolean {
    return !!this.selectedServiceId() && !!this.selectedProfileId && !!this.selectedRootFolder && !this.isAdding();
  }

  add() {
    if (!this.canAdd()) return;
    this.isAdding.set(true);

    const serviceId = this.selectedServiceId()!;
    const term = `tmdb:${this.tmdbId}`;

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
              next: () => this.finish(),
              error: (err) => {
                console.error('Error adding movie to Radarr:', err);
                alert(`Failed to add movie: ${err.message || 'Unknown error'}`);
                this.isAdding.set(false);
              }
            });
          } else {
            console.warn('Radarr lookup returned no match for TMDB:', this.tmdbId, results);
            this.isAdding.set(false);
            alert('Could not find movie in Radarr lookup. Check logs.');
          }
        },
        error: (err) => {
          console.error('Error searching Radarr:', err);
          this.isAdding.set(false);
          alert(`Error searching Radarr: ${err.message}`);
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
              next: () => this.finish(),
              error: (err) => {
                console.error('Error adding series to Sonarr:', err);
                alert(`Failed to add series: ${err.message || 'Unknown error'}`);
                this.isAdding.set(false);
              }
            });
          } else {
            console.warn('Sonarr lookup returned no match for TMDB:', this.tmdbId, results);
            this.isAdding.set(false);
            if (results.length > 0) {
              alert(`Found ${results.length} results but TMDB ID didn't match. First: ${results[0].title} (${results[0].tmdbId})`);
            } else {
              alert('Could not find series in Sonarr lookup.');
            }
          }
        },
        error: (err) => {
          console.error('Error searching Sonarr:', err);
          this.isAdding.set(false);
          alert(`Error searching Sonarr: ${err.message}`);
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
