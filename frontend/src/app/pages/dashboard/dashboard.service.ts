import {effect, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServiceType} from '../../services/services';
import {AuthService} from '../../services/auth';

export enum WidgetType {
  SONARR_CALENDAR = 'sonarr-calendar',
  SONARR_RECENT = 'sonarr-recent',
  QUEUE = 'queue',
  AI_RECOMMENDATIONS = 'ai-recommendations',
  RADARR_RECENT = 'radarr-recent',
  RADARR_RECOMMENDED = 'radarr-recommended',
  TRAKT_TRENDING_MOVIES = 'trakt-trending-movies',
  TRAKT_TRENDING_SHOWS = 'trakt-trending-shows',
  UNIFIED_RECOMMENDATIONS = 'unified-recommendations',
  UNIFIED_RECOMMENDATIONS_MOVIE = 'unified-recommendations-movie',
  UNIFIED_RECOMMENDATIONS_SHOW = 'unified-recommendations-show',
  SMART_COLLECTION = 'smart-collection',
  UNKNOWN = 'unknown'
}

export interface DashboardWidget {
  id: string; // unique UUID
  type: WidgetType; // e.g., 'sonarr-calendar', 'radarr-recent'
  serviceId?: number | string; // number for services, string for generic types
  serviceType?: ServiceType | string;
  cols: number;
  rows: number;
  x: number;
  y: number;
  title?: string;
  icon?: string;
}

const DEFAULT_WIDGETS: DashboardWidget[] = []; // Initial empty, will be populated if services exist

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  readonly widgets = signal<DashboardWidget[]>([]);
  readonly editMode = signal<boolean>(false);

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  constructor() {
    // Load layout when user profile is available
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.dashboardConfig) {
        // If backend has config, use it
        try {
          // Check if it's already an object or needs parsing
          const config = typeof user.dashboardConfig === 'string'
            ? JSON.parse(user.dashboardConfig)
            : user.dashboardConfig;

          if (Array.isArray(config)) {
            this.widgets.set(config);
          }
        } catch (e) {
          console.error('Failed to parse dashboard config from user profile', e);
        }
      }
    });

    // Auto-save whenever widgets change
    effect(() => {
      const w = this.widgets();
      if (this.authService.isAuthenticated() && w.length > 0) {
        this.saveLayout(w);
      }
    });
  }

  toggleEditMode() {
    this.editMode.update(v => !v);
  }

  addWidget(widget: Partial<DashboardWidget>) {
    const newWidget: DashboardWidget = {
      id: this.generateUUID(),
      x: 0,
      y: 0,
      cols: 1,
      rows: 1,
      type: WidgetType.UNKNOWN,
      ...widget,
    };

    this.widgets.update(current => [...current, newWidget]);
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for non-secure contexts (e.g. http) or older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  removeWidget(id: string) {
    this.widgets.update(current => current.filter(w => w.id !== id));
  }

  updateWidgetPosition(item: DashboardWidget) {
    this.widgets.update(current => {
      return current.map(w => {
        if (w.id === item.id) {
          return {...w, x: item.x, y: item.y, cols: item.cols, rows: item.rows};
        }
        return w;
      });
    });
  }

  saveLayout(widgets: DashboardWidget[]) {
    this.http.patch('/api/v1/users/me', {
      dashboardConfig: widgets
    }).subscribe({
      error: (err: unknown) => console.error('Failed to save dashboard layout', err)
    });
  }
}
