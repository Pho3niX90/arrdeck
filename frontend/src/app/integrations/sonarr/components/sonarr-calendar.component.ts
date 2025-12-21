import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {SonarrService} from '../sonarr.service';
import {SonarrDataService} from '../sonarr.data.service';
import {SonarrEpisode, SonarrSeries} from '../sonarr.models';
import {WidgetCardComponent} from '../../../components/widget-card/widget-card.component';
import {TmdbImagePipe} from '../../../pipes/tmdb-image.pipe';

@Component({
  selector: 'app-sonarr-calendar',
  standalone: true,
  imports: [CommonModule, WidgetCardComponent, NgOptimizedImage, TmdbImagePipe],
  templateUrl: './sonarr-calendar.component.html',
  styles: ``
})
export class SonarrCalendarComponent implements OnInit {
  @Input({required: true}) serviceId!: number;

  private sonarrService = inject(SonarrService);
  private dataService = inject(SonarrDataService);

  episodes = signal<SonarrEpisode[]>([]);
  loading = signal(true);

  ngOnInit() {
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Ensure Series Data is cached (for lookup)
    this.dataService.loadSeries(this.serviceId).subscribe(() => {
      // 2. Then fetch calendar
      this.fetchCalendar(start, end);
    });
  }

  private fetchCalendar(start: string, end: string) {
    this.sonarrService.getCalendar(this.serviceId, start, end).subscribe({
      next: (data) => {
        // Enrich episodes if series is missing (though API usually provides it, this is safer)
        const enriched = data.map(ep => {
          if (!ep.series && ep.seriesId) {
            ep.series = this.dataService.getSeries(this.serviceId, ep.seriesId);
          }
          return ep;
        });
        this.episodes.set(enriched);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getFanart(series: SonarrSeries | undefined): string {
    if (!series) return '';
    return series.images.find(i => i.coverType === 'fanart')?.remoteUrl || '';
  }
}
