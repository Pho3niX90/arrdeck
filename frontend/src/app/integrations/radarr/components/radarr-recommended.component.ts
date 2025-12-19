import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RadarrDataService } from '../radarr.data.service';
import { RadarrMovie } from '../radarr.models';
import { WidgetCardComponent } from '../../../components/widget-card/widget-card.component';

@Component({
    selector: 'app-radarr-recommended',
    standalone: true,
    imports: [CommonModule, NgOptimizedImage, WidgetCardComponent],
    templateUrl: './radarr-recommended.component.html',
    styles: ``
})
export class RadarrRecommendedComponent implements OnInit {
    @Input({ required: true }) serviceId!: number;

    private dataService = inject(RadarrDataService);
    movies = signal<RadarrMovie[]>([]);

    ngOnInit() {
        this.dataService.loadMovies(this.serviceId).subscribe(() => {
            const allMovies = this.dataService.getMoviesForService(this.serviceId);
            const sorted = allMovies
                .filter(m => m.hasFile) // Only show movies we actually have
                .sort((a, b) => b.ratings.value - a.ratings.value);

            this.movies.set(sorted.slice(0, 10));
        });
    }

    getPoster(movie: RadarrMovie): string {
        const poster = movie.images.find(i => i.coverType === 'poster');
        return poster ? poster.remoteUrl : '';
    }
}
