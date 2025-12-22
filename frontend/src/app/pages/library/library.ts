import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceConfig, ServicesService } from '../../services/services';
import { LibraryItem, LibraryService } from '../../services/library.service';
import { DetailsModalComponent } from '../../components/details-modal/details-modal.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, DetailsModalComponent],
  templateUrl: './library.html',
  styles: ``
})
export class LibraryPage {
  private servicesService = inject(ServicesService);
  private libraryService = inject(LibraryService);

  services = signal<ServiceConfig[]>([]);
  items = signal<LibraryItem[]>([]);
  loading = signal(true);

  // Filters
  filterType = signal<'all' | 'movie' | 'show'>('all');
  searchQuery = signal('');
  sortBy = signal<'added' | 'title' | 'year' | 'rating'>('added');

  detailsModal = signal<{ type: 'movie' | 'show', tmdbId: number, tvdbId?: number } | null>(null);

  constructor() {
    this.servicesService.getServices().subscribe(s => this.services.set(s));
    this.loadLibrary();
  }

  loadLibrary() {
    this.loading.set(true);
    this.libraryService.getLibraryItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (e) => {
        console.error('Failed to load library', e);
        this.loading.set(false);
      }
    });
  }

  filteredItems = computed(() => {
    let result = this.items();
    const q = this.searchQuery().toLowerCase();
    const t = this.filterType();
    const sort = this.sortBy();

    // Type Filter
    if (t !== 'all') {
      result = result.filter(i => i.type === t);
    }

    // Search
    if (q) {
      result = result.filter(i => i.title.toLowerCase().includes(q));
    }

    // Sort
    result = [...result].sort((a, b) => { // Create copy to not mutate signal source if it was ref
      switch (sort) {
        case 'added': return b.added.getTime() - a.added.getTime();
        case 'title': return a.title.localeCompare(b.title);
        case 'year': return b.year - a.year;
        case 'rating': return b.rating - a.rating;
        default: return 0;
      }
    });

    return result;
  });

  openDetails(item: LibraryItem) {
    this.detailsModal.set({
      type: item.type,
      tmdbId: item.tmdbId,
      tvdbId: item.tvdbId
    });
  }
}
