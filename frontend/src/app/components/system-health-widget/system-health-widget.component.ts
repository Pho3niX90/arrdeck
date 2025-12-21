import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {WidgetCardComponent} from '../widget-card/widget-card.component';
import {ServiceConfig, ServicesService, ServiceType} from '../../services/services';
import {SonarrService} from '../../integrations/sonarr/sonarr.service';
import {RadarrService} from '../../integrations/radarr/radarr.service';
import {forkJoin, map, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

interface SystemInfo {
  serviceId: number;
  name: string;
  type: ServiceType;
  version?: string;
  isLinux?: boolean;
  diskSpace?: {
    path: string;
    label: string;
    freeSpace: number;
    totalSpace: number;
  }[];
  error?: boolean;
}

@Component({
  selector: 'app-system-health-widget',
  standalone: true,
  imports: [CommonModule, WidgetCardComponent],
  templateUrl: './system-health-widget.component.html',
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
export class SystemHealthWidgetComponent implements OnInit {
  private servicesService = inject(ServicesService);
  private sonarr = inject(SonarrService);
  private radarr = inject(RadarrService);

  systems = signal<SystemInfo[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.servicesService.getServices().subscribe(services => {
      const tasks = services
        .filter(s => s.type === ServiceType.SONARR || s.type === ServiceType.RADARR)
        .map(s => this.fetchSystemInfo(s));

      if (tasks.length === 0) {
        this.loading.set(false);
        return;
      }

      forkJoin(tasks).subscribe(results => {
        this.systems.set(results);
        this.loading.set(false);
      });
    });
  }

  fetchSystemInfo(service: ServiceConfig): import('rxjs').Observable<SystemInfo> {
    const api = service.type === ServiceType.SONARR ? this.sonarr : this.radarr;

    // We need status for version and diskspace for disks
    // Sonarr/Radarr 'system/status' returns { version: '...', ... }

    return forkJoin({
      status: api.getSystemStatus(service.id!).pipe(catchError(() => of(null))),
      disks: api.getDiskSpace(service.id!).pipe(catchError(() => of([])))
    }).pipe(
      map(({status, disks}) => ({
        serviceId: service.id!,
        name: service.name,
        type: service.type,
        version: status?.version,
        isLinux: status?.isLinux, // if available
        diskSpace: disks || [],
        error: !status
      } as SystemInfo))
    );
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
}
