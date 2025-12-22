import {Component, inject, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SonarrQueueResponse} from '../../integrations/sonarr/sonarr.models';
import {RadarrQueueResponse} from '../../integrations/radarr/radarr.models';
import {WidgetCardComponent} from '../widget-card/widget-card.component';
import {Subscription} from 'rxjs';
import {WebsocketService} from '../../services/websocket.service';

export interface QueueItem {
  title: string;
  size: number;
  sizeleft: number;
  timeleft: string;
  status: string;
  trackedDownloadStatus: string;
  downloadId: string;
  protocol: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-queue-widget',
  standalone: true,
  imports: [CommonModule, WidgetCardComponent],
  templateUrl: './queue-widget.component.html',
  styles: `
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #374151;
      border-radius: 4px;
    }
  `
})
export class QueueWidgetComponent implements OnInit, OnDestroy {
  @Input({required: true}) serviceId!: number;
  @Input({required: true}) type!: 'sonarr' | 'radarr';

  private wsService = inject(WebsocketService);

  queue = signal<QueueItem[]>([]);
  loading = signal(true); // Start loading true
  private wsSubscription?: Subscription;

  ngOnInit() {
    this.wsSubscription = this.wsService.on<SonarrQueueResponse | RadarrQueueResponse>(`queueUpdate:${this.serviceId}`)
      .subscribe(data => {
        const mappedItems = (data.records || []).map(x => (<QueueItem>{
          title: x.title,
          size: x.size,
          sizeleft: x.sizeleft,
          status: x.status,
          timeleft: x.timeleft,
        }));
        const uniqueItems = [...new Map(mappedItems.map(item => [item.title, item])).values()];
        this.queue.set(uniqueItems || []);
        this.loading.set(false);
      });
  }

  ngOnDestroy() {
    this.wsSubscription?.unsubscribe();
  }

  getProgress(item: QueueItem): number {
    if (!item.size || item.size === 0) return 0;
    const size = Number(item.size);
    const sizeleft = Number(item.sizeleft);
    if (isNaN(size) || isNaN(sizeleft)) return 0;

    const progress = ((size - sizeleft) / size) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  formatBytes(bytes: number, decimals = 1): string {
    const b = Number(bytes);
    if (!b || b === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
