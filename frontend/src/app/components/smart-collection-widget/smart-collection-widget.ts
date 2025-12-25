import {Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LibraryItem, LibraryService} from '../../services/library.service';
import {DetailsModalService} from '../../services/details-modal.service';
import {MediaItem} from '../../shared/models/media-item.model';
import {WidgetBase} from '../../shared/base/widget-base';
import {HorizontalCardComponent} from '../../shared/components/horizontal-card/horizontal-card.component';

@Component({
  selector: 'app-smart-collection-widget',
  standalone: true,
  imports: [CommonModule, HorizontalCardComponent],
  template: `
    <app-horizontal-card
      [title]="title()"
      [subtitle]="'Suggests ' + items().length"
      accentColor="text-amber-400"
      baseColor="amber"
      [items]="mediaItems()"
      [rows]="rows()"
      [loading]="loading()">

      <div header-icon>
        @if (icon()) {
          <span class="text-xs">{{ icon() }}</span>
        }
      </div>
    </app-horizontal-card>
  `
})
export class SmartCollectionWidget extends WidgetBase implements OnInit {
  title = input.required<string>();
  type = input.required<'underrated' | 'marathon' | 'quick'>();
  icon = input<string>();

  private libraryService = inject(LibraryService);
  private detailsModalService = inject(DetailsModalService);

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
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>',
        colorClass: 'bg-amber-500/80 text-white'
      } : undefined,
      bottomLeftBadge: {
        text: item.type === 'movie' ? 'Radarr' : 'Sonarr',
        colorClass: item.type === 'movie' ? 'bg-amber-600/80 text-white font-bold text-[10px]' : 'bg-emerald-600/80 text-white font-bold text-[10px]'
      },
      bottomCenterOverlay: item.year ? {
        text: item.year.toString(),
        location: 'bottom'
      } : undefined
    };
  }

  openDetails(item: LibraryItem) {
    this.detailsModalService.open({
      tmdbId: item.tmdbId,
      type: item.type,
      tvdbId: item.tvdbId
    });
  }
}
