import { Component, computed, inject, signal, input, ViewChild, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { DetailsModalComponent } from '../details-modal/details-modal.component';
import { AiRecommendationsService, RecommendationResponse } from '../../services/ai-recommendations.service';
import { MessageService } from '../../services/message.service';
import { WidgetCardComponent } from '../widget-card/widget-card.component';
import { FormsModule } from '@angular/forms';
import { MediaCarouselComponent } from '../../shared/components/media-carousel/media-carousel.component';
import { MediaItem } from '../../shared/models/media-item.model';
import { SonarrService } from '../../integrations/sonarr/sonarr.service';
import { RadarrService } from '../../integrations/radarr/radarr.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface EnrichedRecommendation {
    title: string;
    year?: number;
    reason: string;
    overview?: string;
    tmdbId?: number;
    remotePoster?: string;
    added?: boolean;
    monitored?: boolean;
    tvdbId?: number;
}

import { TmdbImagePipe } from '../../pipes/tmdb-image.pipe';

@Component({
    selector: 'app-ai-recommendations-widget',
    standalone: true,
    imports: [CommonModule, WidgetCardComponent, FormsModule, DetailsModalComponent, MediaCarouselComponent],
    providers: [TmdbImagePipe],
    templateUrl: './ai-recommendations-widget.component.html',
    styleUrls: ['./ai-recommendations-widget.component.css']
})
export class AiRecommendationsWidgetComponent implements OnInit {
    serviceId = input.required<number>();
    type = input.required<'sonarr' | 'radarr'>();

    @ViewChild(DetailsModalComponent) detailsModal!: DetailsModalComponent;

    ngOnInit() {
        this.generate();
    }

    private aiService = inject(AiRecommendationsService);
    private sonarrService = inject(SonarrService);
    private radarrService = inject(RadarrService);
    private tmdbImagePipe = inject(TmdbImagePipe);
    private messageService = inject(MessageService);

    recommendations = signal<EnrichedRecommendation[]>([]);

    mediaItems = computed<MediaItem[]>(() => {
        return this.recommendations().map(item => ({
            id: item.tmdbId || item.title,
            title: item.title,
            subtitle: item.year?.toString(),
            imageUrl: this.tmdbImagePipe.transform(item.remotePoster, 'w185'),
            clickAction: () => this.openDetails(item),
            accentColor: 'text-purple-400',

            topLeftBadge: item.added ? {
                iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" /></svg>',
                colorClass: 'bg-green-500/80 text-white'
            } : undefined,

            topRightBadge: {
                text: 'AI',
                colorClass: 'bg-purple-600/80 text-white font-bold text-[10px]'
            }
        }));
    });

    loading = signal(false);
    enriching = signal(false);
    error = signal<string | null>(null);
    customPrompt = signal('');
    showPromptInput = signal(false);

    generate() {
        this.loading.set(true);
        this.error.set(null);
        this.recommendations.set([]);

        const prompt = this.customPrompt() || undefined;

        this.aiService.getRecommendations(this.serviceId(), this.type(), prompt).subscribe({
            next: (response: RecommendationResponse) => {
                this.loading.set(false);
                this.enrichRecommendations(response.recommendations);
            },
            error: (err: any) => {
                console.error('AI Recommendation Error', err);
                this.error.set('Failed to generate recommendations. Please try again.');
                this.loading.set(false);
            }
        });
    }

    enrichRecommendations(items: RecommendationResponse['recommendations']) {
        this.enriching.set(true);

        const lookups = items.map(item => {
            const query = `${item.title} ${item.year || ''}`;
            const lookup$ = this.type() === 'sonarr'
                ? this.sonarrService.lookup(this.serviceId(), query)
                : this.radarrService.lookup(this.serviceId(), query);

            return lookup$.pipe(
                map(results => {
                    const match = results && results.length > 0 ? results[0] : null;
                    return {
                        ...item,
                        ...match,
                        overview: match?.overview || item.overview,
                        title: match?.title || item.title,
                        year: match?.year || item.year,
                        remotePoster: match?.remotePoster || match?.images?.find((img: any) => img.coverType === 'poster')?.url,
                        added: !!(match?.id && match.id > 0),
                        monitored: match?.monitored,
                        tmdbId: match?.tmdbId || item.tmdbId
                    };
                }),
                catchError(() => of(item))
            );
        });

        forkJoin(lookups).subscribe({
            next: (enriched) => {
                this.recommendations.set(enriched);
                this.enriching.set(false);
            },
            error: () => {
                this.recommendations.set(items);
                this.enriching.set(false);
            }
        });
    }

    add(item: any) {
        if (!confirm(`Add ${item.title} to library?`)) return;
        this.messageService.show('Quick Add requires configuring defaults. For now, please search in the main app to add with options.', 'info');
    }

    openDetails(item: any) {
        this.detailsModal.type = this.type() === 'sonarr' ? 'show' : 'movie';

        this.detailsModal.traktId = undefined;
        this.detailsModal.tmdbId = undefined;
        this.detailsModal.tvdbId = undefined;

        if (item.tmdbId) this.detailsModal.tmdbId = item.tmdbId;
        if (item.tvdbId) this.detailsModal.tvdbId = item.tvdbId;

        if (item.tmdbId || item.tvdbId) {
            this.detailsModal.open();
        } else {
            console.warn('Cannot open details: No usable ID found for', item.title);
        }
    }

    togglePrompt() {
        this.showPromptInput.update(v => !v);
    }
}
