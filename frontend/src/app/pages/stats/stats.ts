import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StatsOverview, StatsService} from '../../services/stats.service';

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html'
})
export class StatsPageComponent {
  statsService = inject(StatsService);
  overview = signal<StatsOverview | null>(null);

  constructor() {
    this.statsService.getOverview().subscribe(data => {
      this.overview.set(data);
    });
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  getPercentage(current: number, total: number) {
    if (!total) return 0;
    return (current / total) * 100;
  }
}
