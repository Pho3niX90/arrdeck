import {Component, computed, inject, input, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LibraryItem, LibraryService} from '../../services/library.service';
import {DetailsModalComponent} from '../details-modal/details-modal.component';
import {WidgetCardComponent} from '../widget-card/widget-card.component';
import {MediaCarouselComponent} from '../../shared/components/media-carousel/media-carousel.component';
import {MediaItem} from '../../shared/models/media-item.model';

@Component({
  selector: 'app-smart-collection-widget',
  standalone: true,
  imports: [CommonModule, WidgetCardComponent, MediaCarouselComponent, DetailsModalComponent],
  template: `
    <app-widget-card [title]="title()" [subtitle]="'Suggests ' + items().length" accentColor="text-amber-400">
      <div header-icon class="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
        @if (icon()) {
          <span class="text-xs">{{ icon() }}</span>
        }
      </div>

      @if (loading()) {
        <div class="flex gap-4 p-4 overflow-hidden">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="w-32 aspect-2/3 bg-slate-800/50 rounded-lg animate-pulse shrink-0"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="h-full flex flex-col items-center justify-center text-slate-500 text-sm p-4">
          <p>No matches found.</p>
        </div>
      } @else {
        <app-media-carousel [items]="mediaItems()"/>
      }
      <app-details-modal></app-details-modal>
    </app-widget-card>
  `
})
export class SmartCollectionWidget implements OnInit {
  title = input.required<string>();
  type = input.required<'underrated' | 'marathon' | 'quick'>();
  icon = input<string>();

  private libraryService = inject(LibraryService);

  @ViewChild(DetailsModalComponent) detailsModal!: DetailsModalComponent;

  items = signal<LibraryItem[]>([]);
  loading = signal(true);

  mediaItems = computed<MediaItem[]>(() => {
    return this.items().map(item => this.mapToMediaItem(item));
  });

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.loading.set(true);
    let obs;
    switch (this.type()) {
      case 'underrated':
        obs = this.libraryService.getUnderrated();
        break;
      case 'marathon':
        obs = this.libraryService.getMarathonWorthy();
        break;
      case 'quick':
        obs = this.libraryService.getQuickWatch();
        break;
      default:
        obs = this.libraryService.getUnderrated();
    }

    obs.subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load smart collection', err);
        this.loading.set(false);
      }
    });
  }

  private mapToMediaItem(item: LibraryItem): MediaItem {
    return {
      id: item.tmdbId,
      title: item.title,
      imageUrl: item.posterUrl || '',
      clickAction: () => this.openDetails(item),
      accentColor: 'text-amber-400',
      topRightBadge: item.rating > 0 ? {
        text: item.rating.toFixed(1),
        colorClass: 'bg-black/70 text-white'
      } : undefined,
      bottomOverlay: {
        text: item.year?.toString() || '',
        location: 'bottom'
      }
    };
  }

  openDetails(item: LibraryItem) {
    this.detailsModal.tmdbId = item.tmdbId;
    this.detailsModal.type = item.type;
    this.detailsModal.tvdbId = item.tvdbId;
    this.detailsModal.open();
  }
}
