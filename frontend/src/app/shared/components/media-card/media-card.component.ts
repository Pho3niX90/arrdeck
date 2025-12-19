import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MediaItem } from '../../models/media-item.model';
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';

@Component({
  selector: 'app-media-card',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, SafeHtmlPipe],
  templateUrl: './media-card.component.html',
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaCardComponent {
  item = input.required<MediaItem>();
}
