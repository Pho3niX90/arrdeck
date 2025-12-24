import { Component, computed, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryItem, LibraryService } from '../../services/library.service';
import { DetailsModalService } from '../../services/details-modal.service';
import { MediaItem } from '../../shared/models/media-item.model';
import { WidgetBase } from '../../shared/base/widget-base';
import { HorizontalCardComponent } from '../../shared/components/horizontal-card/horizontal-card.component';

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
        colorClass: 'bg-black/70 text-white'
      } : undefined,
      bottomOverlay: {
        text: item.year?.toString() || '',
        location: 'bottom'
      }
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
