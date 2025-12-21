import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ServicesService, ServiceType} from '../../services/services';
import {SonarrService} from '../../integrations/sonarr/sonarr.service';
import {RadarrService} from '../../integrations/radarr/radarr.service';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'sonarr' | 'radarr';
  serviceName: string;
  posterPath?: string;
  overview?: string;
  episodeNumber?: number;
  seasonNumber?: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styles: ``
})
export class Calendar implements OnInit {
  private servicesService = inject(ServicesService);
  private sonarrService = inject(SonarrService);
  private radarrService = inject(RadarrService);

  currentDate = signal(new Date());
  events = signal<CalendarEvent[]>([]);
  isLoading = signal(false);

  daysInMonth = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const result = [];
    // Padding for first day
    for (let i = 0; i < firstDay; i++) {
      result.push(null);
    }
    // Days
    for (let i = 1; i <= days; i++) {
      result.push(new Date(year, month, i));
    }
    return result;
  });

  monthName = computed(() => {
    return this.currentDate().toLocaleString('default', {month: 'long', year: 'numeric'});
  });

  ngOnInit() {
    this.loadEvents();
  }

  changeMonth(delta: number) {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    this.currentDate.set(newDate);
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading.set(true);
    const date = this.currentDate();
    const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

    this.servicesService.getServices().subscribe(services => {
      const requests: any[] = [];

      services.forEach(s => {
        if (s.type === ServiceType.SONARR && s.apiKey) {
          requests.push(
            this.sonarrService.getCalendar(s.id!, start, end).pipe(
              catchError(() => of([])),
              catchError(err => {
                console.log(err);
                return of([])
              })
            )
          );
        } else if (s.type === ServiceType.RADARR && s.apiKey) {
          requests.push(
            this.radarrService.getCalendar(s.id!, start, end).pipe(
              catchError(() => of([])),
              catchError(err => {
                console.log(err);
                return of([])
              })
            )
          );
        }
      });

      if (requests.length === 0) {
        this.isLoading.set(false);
        return;
      }

      forkJoin(requests).subscribe(results => {
        const allEvents: CalendarEvent[] = [];
        let index = 0;

        services.forEach(s => {
          if ((s.type === ServiceType.SONARR || s.type === ServiceType.RADARR) && s.apiKey) {
            const data = results[index++];
            if (s.type === ServiceType.SONARR) {
              (data as any[]).forEach(ep => {
                allEvents.push({
                  id: `sonarr-${ep.id}`,
                  title: ep.title,
                  date: new Date(ep.airDateUtc),
                  type: 'sonarr',
                  serviceName: s.name,
                  // Sonarr provides series images, usually array
                  posterPath: ep.series?.images?.find((i: any) => i.coverType === 'poster')?.url,
                  overview: ep.overview,
                  seasonNumber: ep.seasonNumber,
                  episodeNumber: ep.episodeNumber
                });
              });
            } else {
              (data as any[]).forEach(movie => {
                // Radarr calendar structure: check date
                const releaseDate = movie.inCinemas || movie.digitalRelease || movie.physicalRelease;
                if (releaseDate) {
                  allEvents.push({
                    id: `radarr-${movie.id}`,
                    title: movie.title,
                    date: new Date(releaseDate),
                    type: 'radarr',
                    serviceName: s.name,
                    posterPath: movie.images?.find((i: any) => i.coverType === 'poster')?.url,
                    overview: movie.overview
                  });
                }
              });
            }
          }
        });

        // Sort by date
        allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
        this.events.set(allEvents);
        this.isLoading.set(false);
      });
    });
  }

  getEventsForDay(date: Date | null): CalendarEvent[] {
    if (!date) return [];
    return this.events().filter(e =>
      e.date.getDate() === date.getDate() &&
      e.date.getMonth() === date.getMonth() &&
      e.date.getFullYear() === date.getFullYear()
    );
  }
}
