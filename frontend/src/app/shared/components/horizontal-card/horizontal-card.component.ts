import {Component, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {WidgetCardComponent} from '../../../components/widget-card/widget-card.component';
import {MediaCarouselComponent} from '../media-carousel/media-carousel.component';
import {MediaItem} from '../../models/media-item.model';

@Component({
  selector: 'app-horizontal-card',
  standalone: true,
  imports: [CommonModule, WidgetCardComponent, MediaCarouselComponent],
  template: `
    <app-widget-card [title]="title()" [subtitle]="subtitle()" [accentColor]="accentColor()">
      <div header-icon class="w-5 h-5 rounded-full flex items-center justify-center"
           [class]="'bg-' + baseColor() + '-500/20 text-' + baseColor() + '-400'">
        <ng-content select="[header-icon]"></ng-content>
      </div>

      <div class="h-full">
        @if (loading()) {
          <div class="flex gap-4 p-4 overflow-hidden h-full items-center">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="w-32 aspect-2/3 bg-slate-800/50 rounded-lg animate-pulse shrink-0"></div>
            }
          </div>
        } @else if (items().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-slate-500 text-sm p-4">
            <p>No items found.</p>
          </div>
        } @else {
          <app-media-carousel [items]="items()" [rows]="rows()"/>
        }
      </div>

      <ng-content select="app-details-modal"></ng-content>
    </app-widget-card>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class HorizontalCardComponent {
  title = input.required<string>();
  subtitle = input<string>();
  accentColor = input<string>('text-blue-400');
  baseColor = input<string>('blue'); // For header icon bg/text
  items = input.required<MediaItem[]>();
  rows = input(1);
  loading = input(false);
}
