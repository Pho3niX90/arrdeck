import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ServiceConfig, ServicesService, ServiceType} from '../../services/services';
import {SonarrService} from '../../integrations/sonarr/sonarr.service';
import {RadarrService} from '../../integrations/radarr/radarr.service';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

interface ServiceWithStatus extends ServiceConfig {
  status?: 'online' | 'offline' | 'unknown' | 'loading';
  version?: string;
  error?: string;
  diskSpace?: any[];
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.html',
  styles: ``
})
export class Services implements OnInit {
  private servicesService = inject(ServicesService);
  private sonarrService = inject(SonarrService);
  private radarrService = inject(RadarrService);

  services = signal<ServiceWithStatus[]>([]);

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.servicesService.getServices().subscribe(services => {
      // Initialize with loading status
      const initialServices: ServiceWithStatus[] = services.map(s => ({
        ...s,
        status: 'loading'
      }));
      this.services.set(initialServices);

      // fetch status for each
      initialServices.forEach(s => {
        this.refreshStatus(s);
      });
    });
  }

  refreshStatus(service: ServiceWithStatus) {
    const statusObs = this.servicesService.getSystemStatus(service).pipe(
      catchError(err => of({error: err}))
    );

    let diskObs = of<any[]>([]);
    if (service.type === ServiceType.SONARR) {
      diskObs = this.sonarrService.getDiskSpace(service.id!).pipe(catchError(() => of<any[]>([])));
    } else if (service.type === ServiceType.RADARR) {
      diskObs = this.radarrService.getDiskSpace(service.id!).pipe(catchError(() => of<any[]>([])));
    }

    forkJoin({
      status: statusObs,
      disks: diskObs
    }).subscribe(({status, disks}: { status: any, disks: any[] }) => {
      this.services.update(current =>
        current.map(s => {
          if (s.id === service.id) {
            if (status.error) {
              return {...s, status: 'offline', error: 'Failed to connect'};
            }

            return {
              ...s,
              status: 'online',
              version: status.version || status.appName,
              diskSpace: disks
            };
          }
          return s;
        })
      );
    });
  }

  formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getUsagePercent(disk: any): number {
    if (!disk.totalSpace) return 0;
    const used = disk.totalSpace - disk.freeSpace;
    return (used / disk.totalSpace) * 100;
  }

  getUsageColor(disk: any): string {
    const p = this.getUsagePercent(disk);
    if (p > 90) return 'bg-red-500';
    if (p > 75) return 'bg-amber-500';
    return 'bg-blue-500';
  }

  getIcon(type: ServiceType): string {
    switch (type) {
      case ServiceType.SONARR:
        return 'images/sonarr.png';
      case ServiceType.RADARR:
        return 'images/radarr.png';
      case ServiceType.TRAKT:
        return 'images/trakt.svg';
      case ServiceType.TMDB:
        return 'images/tmdb.svg';
      case ServiceType.JELLYFIN:
        return 'images/jellyfin.png';
      case ServiceType.AI:

        return 'images/gemini.png'; // dynamic logic can be improved
      default:
        return 'icons/generic.svg'; // fallback
    }
  }
}
