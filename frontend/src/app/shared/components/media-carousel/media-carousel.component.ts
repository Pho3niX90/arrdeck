import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MediaCardComponent} from '../media-card/media-card.component';
import {MediaItem} from '../../models/media-item.model';

@Component({
  selector: 'app-media-carousel',
  standalone: true,
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './media-carousel.component.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaCarouselComponent implements AfterViewInit, OnDestroy {
  items = input.required<MediaItem[]>();
  rows = input(1);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  private ngZone = inject(NgZone);
  private animationFrameId: number | null = null;
  private isPaused = false;
  private scrollAmount = 0.5;

  ngAfterViewInit() {
    this.startScroll();
  }

  ngOnDestroy() {
    this.stopScroll();
  }

  startScroll() {
    if (this.rows() > 1) return; // No auto-scroll in grid mode
    this.ngZone.runOutsideAngular(() => {
      const scroll = () => {
        if (!this.isPaused && this.scrollContainer && this.scrollContainer.nativeElement) {
          const el = this.scrollContainer.nativeElement;
          if (el.scrollWidth > el.clientWidth) {
            el.scrollLeft += this.scrollAmount;
            if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
              el.scrollLeft = 0;
            }
          }
        }
        this.animationFrameId = requestAnimationFrame(scroll);
      };
      this.animationFrameId = requestAnimationFrame(scroll);
    });
  }

  stopScroll() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }
}
