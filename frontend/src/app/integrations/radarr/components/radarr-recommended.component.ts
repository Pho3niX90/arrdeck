import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {RadarrDataService} from '../radarr.data.service';
import {RadarrMovie} from '../radarr.models';
import {WidgetCardComponent} from '../../../components/widget-card/widget-card.component';
import {TmdbImagePipe} from '../../../pipes/tmdb-image.pipe';

@Component({
  selector: 'app-radarr-recommended',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, WidgetCardComponent, TmdbImagePipe],
  templateUrl: './radarr-recommended.component.html',
  styles: ``
})
export class RadarrRecommendedComponent implements OnInit {
  @Input({required: true}) serviceId!: number;

  private dataService = inject(RadarrDataService);
  movies = signal<RadarrMovie[]>([]);

  ngOnInit() {
    this.dataService.loadMovies(this.serviceId).subscribe(() => {
      const allMovies = this.dataService.getMoviesForService(this.serviceId);
      const sorted = allMovies
        .filter(m => m.hasFile) // Only show movies we actually have
        .sort((a, b) => b.ratings.tmdb.value - a.ratings.tmdb.value);

      this.movies.set(sorted.slice(0, 10));
    });
  }

  getPoster(movie: RadarrMovie): string {
    return movie.images.find(i => i.coverType === 'poster')?.remoteUrl || '';
  }
}
