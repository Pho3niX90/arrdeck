import { Component, Input, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RadarrDataService } from '../radarr.data.service';
import { RadarrMovie } from '../radarr.models';
import { WidgetCardComponent } from '../../../components/widget-card/widget-card.component';
import { MediaCarouselComponent } from '../../../shared/components/media-carousel/media-carousel.component';
import { MediaItem } from '../../../shared/models/media-item.model';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { DetailsModalComponent } from '../../../components/details-modal/details-modal.component';

@Component({
    selector: 'app-radarr-recent',
    standalone: true,
    imports: [CommonModule, WidgetCardComponent, MediaCarouselComponent, DetailsModalComponent],
    providers: [TimeAgoPipe],
    templateUrl: './radarr-recent.component.html',
    styles: ``
})
export class RadarrRecentComponent implements OnInit {
    @Input({ required: true }) serviceId!: number;

    @ViewChild(DetailsModalComponent) detailsModal!: DetailsModalComponent;

    private dataService = inject(RadarrDataService);
    private timeAgoPipe = inject(TimeAgoPipe);

    movies = signal<RadarrMovie[]>([]);

    mediaItems = computed<MediaItem[]>(() => {
        return this.movies().map(movie => this.mapToMediaItem(movie));
    });

    ngOnInit() {
        this.dataService.loadMovies(this.serviceId).subscribe(() => {
            const allMovies = this.dataService.getMoviesForService(this.serviceId);
            const sorted = allMovies.sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());
            this.movies.set(sorted.slice(0, Math.min(50,sorted.length) ));
        });
    }

    private mapToMediaItem(movie: RadarrMovie): MediaItem {
        const poster = movie.images.find(i => i.coverType === 'poster')?.remoteUrl || '';

        return {
            id: movie.id,
            title: movie.title,
            imageUrl: poster,
            clickAction: () => this.openDetails(movie),
            accentColor: 'text-amber-400',
            topRightBadge: movie.ratings?.value ? {
                text: movie.ratings.value.toFixed(1),
                colorClass: 'bg-black/70 text-white'
            } : undefined,
            bottomOverlay: {
                text: this.timeAgoPipe.transform(movie.added),
                location: 'bottom'
            }
        };
    }

    openDetails(movie: RadarrMovie) {
        this.detailsModal.type = 'movie';
        // Radarr movies have tmdbId. Pass it to modal to resolve Trakt ID.
        this.detailsModal.tmdbId = movie.tmdbId;
        this.detailsModal.open();
    }
}
