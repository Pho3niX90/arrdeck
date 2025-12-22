import { Component, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryItem, LibraryService } from '../../services/library.service';
import { DetailsModalComponent } from '../../components/details-modal/details-modal.component';

@Component({
    selector: 'app-smart-collection-widget',
    standalone: true,
    imports: [CommonModule, DetailsModalComponent],
    template: `
    <div class="h-full flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-slate-800/50 flex justify-between items-center">
        <h3 class="text-white font-medium flex items-center gap-2">
          @if (icon()) { <span class="text-lg">{{ icon() }}</span> }
          {{ title() }}
        </h3>
        <span class="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-900 rounded-md border border-slate-800">
           Suggests {{ items().length }}
        </span>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        @if (loading()) {
            <div class="grid grid-cols-2 gap-3">
               @for(i of [1,2,3,4]; track i) {
                 <div class="aspect-[2/3] bg-slate-800/50 rounded-lg animate-pulse"></div>
               }
            </div>
        } @else if (items().length === 0) {
           <div class="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
             <p>No matches found.</p>
           </div>
        } @else {
           <div class="grid grid-cols-2 lg:grid-cols-2 gap-3">
             @for (item of items(); track item.uniqueId) {
               <div 
                 class="group relative aspect-[2/3] bg-slate-900 rounded-lg overflow-hidden cursor-pointer border border-slate-800 hover:border-slate-600 transition-all hover:shadow-lg"
                 (click)="openDetails(item)"
               >
                 @if (item.posterUrl) {
                   <img [src]="item.posterUrl" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                 } @else {
                   <div class="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600 text-xs text-center p-2">
                     {{ item.title }}
                   </div>
                 }
                 
                 <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                 
                 <div class="absolute bottom-2 left-2 right-2 translate-y-2 group-hover:translate-y-0 transition-transform">
                   <h4 class="text-white text-xs font-medium leading-tight line-clamp-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity mb-0.5">{{ item.title }}</h4>
                    <div class="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <span class="text-[10px] text-slate-300">{{ item.year }}</span>
                       @if (item.rating > 0) {
                        <div class="flex items-center gap-0.5">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-2.5 h-2.5 text-amber-500">
                             <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
                           </svg>
                           <span class="text-[10px] text-amber-400 font-bold">{{ item.rating.toFixed(1) }}</span>
                        </div>
                       }
                    </div>
                 </div>
               </div>
             }
           </div>
        }
      </div>
      
      @if (detailsModal()) {
        <app-details-modal 
          [type]="detailsModal()!.type" 
          [tmdbId]="detailsModal()!.tmdbId" 
          [tvdbId]="detailsModal()!.tvdbId"
          (close)="detailsModal.set(null)"
        ></app-details-modal>
      }
    </div>
  `
})
export class SmartCollectionWidget {
    title = input.required<string>();
    type = input.required<'underrated' | 'marathon' | 'quick'>();
    icon = input<string>();

    private libraryService = inject(LibraryService);

    items = signal<LibraryItem[]>([]);
    loading = signal(true);
    detailsModal = signal<{ type: 'movie' | 'show', tmdbId: number, tvdbId?: number } | null>(null);

    constructor() {
        // Determine which fetch method to use based on type
        // We defer this slightly to ensure input is available, though usually available in constructor with signals if read in effect
        // But safe to subscribe immediately? Inputs are set before ngOnInit usually.
        // Actually, safer to use effect or perform in ngOnInit.
    }

    ngOnInit() {
        this.loadItems();
    }

    loadItems() {
        this.loading.set(true);
        let obs;
        switch (this.type()) {
            case 'underrated': obs = this.libraryService.getUnderrated(); break;
            case 'marathon': obs = this.libraryService.getMarathonWorthy(); break;
            case 'quick': obs = this.libraryService.getQuickWatch(); break;
            default: obs = this.libraryService.getUnderrated();
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

    openDetails(item: LibraryItem) {
        this.detailsModal.set({
            type: item.type,
            tmdbId: item.tmdbId,
            tvdbId: item.tvdbId
        });
    }
}
