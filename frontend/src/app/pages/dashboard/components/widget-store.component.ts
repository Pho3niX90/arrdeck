import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardWidget, WidgetType } from '../dashboard.service';
import { ServiceConfig, ServicesService, ServiceType } from '../../../services/services';

@Component({
  selector: 'app-widget-store',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-80 h-full bg-slate-900 border-l border-slate-700 shadow-xl p-6 overflow-y-auto shrink-0">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white">Add Widget</h3>
        <button (click)="dashboardService.toggleEditMode()" class="text-slate-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        @for (displayService of availableServices(); track displayService.id || displayService.type) {
          <div>
            <h4
              class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{{ displayService.name || displayService.type }}</h4>
            <div class="grid grid-cols-1 gap-3">
              @for (widget of getWidgetsForService(displayService); track widget.title) {
                <button (click)="addWidget(widget, displayService.id?.toString())"
                        draggable="true"
                        (dragstart)="onDragStart($event, widget, displayService.id?.toString())"
                        class="flex items-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-left group cursor-move">
                  <span class="text-2xl mr-3">{{ widget.icon }}</span>
                  <div>
                    <div class="font-medium text-white group-hover:text-blue-400 transition-colors">{{ widget.title }}
                    </div>
                    <div class="text-xs text-slate-500">{{ widget.cols }}x{{ widget.rows }}</div>
                  </div>
                </button>
              }
            </div>
          </div>
        }

        <!-- Global/Smart Collections -->
        <div>
          <h4 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Smart Collections</h4>
          <div class="grid grid-cols-1 gap-3">
            <button (click)="addSmartWidget('Underrated Gems', 'underrated', '💎')"
                    draggable="true"
                    (dragstart)="onDragStart($event, {type: WidgetType.SMART_COLLECTION, title: 'Underrated Gems', icon: '💎', cols: 1, rows: 1}, 'underrated')"
                    class="flex items-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-left group cursor-move">
              <span class="text-2xl mr-3">💎</span>
              <div>
                <div class="font-medium text-white group-hover:text-blue-400 transition-colors">Underrated Gems</div>
                <div class="text-xs text-slate-500">1x1</div>
              </div>
            </button>
            <button (click)="addSmartWidget('Marathon Worthy', 'marathon', '🍿')"
                    draggable="true"
                    (dragstart)="onDragStart($event, {type: WidgetType.SMART_COLLECTION, title: 'Marathon Worthy', icon: '🍿', cols: 1, rows: 1}, 'marathon')"
                    class="flex items-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-left group cursor-move">
              <span class="text-2xl mr-3">🍿</span>
              <div>
                <div class="font-medium text-white group-hover:text-blue-400 transition-colors">Marathon Worthy</div>
                <div class="text-xs text-slate-500">1x1</div>
              </div>
            </button>
            <button (click)="addSmartWidget('Quick Watch', 'quick', '⚡')"
                    draggable="true"
                    (dragstart)="onDragStart($event, {type: WidgetType.SMART_COLLECTION, title: 'Quick Watch', icon: '⚡', cols: 1, rows: 1}, 'quick')"
                    class="flex items-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-left group cursor-move">
              <span class="text-2xl mr-3">⚡</span>
              <div>
                <div class="font-medium text-white group-hover:text-blue-400 transition-colors">Quick Watch</div>
                <div class="text-xs text-slate-500">1x1</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WidgetStoreComponent {
  dashboardService = inject(DashboardService);
  servicesService = inject(ServicesService);

  availableServices = signal<ServiceConfig[]>([]);

  // Expose Enums to template if needed, though mostly used in TS here
  WidgetType = WidgetType;
  ServiceType = ServiceType;

  constructor() {
    this.servicesService.getServices().subscribe(services => {
      this.availableServices.set(services);
    });
  }

  getWidgetsForService(service: ServiceConfig): Omit<DashboardWidget, 'id' | 'x' | 'y' | 'serviceId'>[] {
    switch (service.type) {
      case ServiceType.SONARR:
        return [
          { type: WidgetType.SONARR_CALENDAR, cols: 1, rows: 1, title: 'Calendar', icon: '📅', serviceType: ServiceType.SONARR },
          { type: WidgetType.SONARR_RECENT, cols: 1, rows: 1, title: 'Recent Releases', icon: '🆕', serviceType: ServiceType.SONARR },
          { type: WidgetType.QUEUE, cols: 1, rows: 1, title: 'Queue', icon: '📥', serviceType: ServiceType.SONARR },
          { type: WidgetType.AI_RECOMMENDATIONS, cols: 1, rows: 1, title: 'AI Recommendations', icon: '🤖', serviceType: ServiceType.SONARR },
        ];
      case ServiceType.RADARR:
        return [
          { type: WidgetType.RADARR_RECENT, cols: 1, rows: 1, title: 'Recent Movies', icon: '🎬', serviceType: ServiceType.RADARR },
          { type: WidgetType.RADARR_RECOMMENDED, cols: 1, rows: 1, title: 'Recommended', icon: '👍', serviceType: ServiceType.RADARR },
          { type: WidgetType.QUEUE, cols: 1, rows: 1, title: 'Queue', icon: '📥', serviceType: ServiceType.RADARR },
          { type: WidgetType.AI_RECOMMENDATIONS, cols: 1, rows: 1, title: 'AI Recommendations', icon: '🤖', serviceType: ServiceType.RADARR },
        ];
      case ServiceType.TRAKT:
        return [
          { type: WidgetType.TRAKT_TRENDING_MOVIES, cols: 1, rows: 1, title: 'Trending Movies', icon: '🔥' },
          { type: WidgetType.TRAKT_TRENDING_SHOWS, cols: 1, rows: 1, title: 'Trending Shows', icon: '📺' },
          { type: WidgetType.UNIFIED_RECOMMENDATIONS, cols: 1, rows: 1, title: 'Recommended Movies', icon: '🎥' },
        ];
      default:
        return [];
    }
  }

  addWidget(widget: Omit<DashboardWidget, 'id' | 'x' | 'y' | 'serviceId'>, serviceId?: string) {
    if (widget.type === WidgetType.UNIFIED_RECOMMENDATIONS) {
      this.dashboardService.addWidget({ ...widget, serviceId, type: WidgetType.UNIFIED_RECOMMENDATIONS_MOVIE });
      return;
    }
    this.dashboardService.addWidget({ ...widget, serviceId });
  }

  onDragStart(event: DragEvent, widget: Omit<DashboardWidget, 'id' | 'x' | 'y' | 'serviceId'>, serviceId?: string) {
    if (widget.type === WidgetType.UNIFIED_RECOMMENDATIONS) {
      const unifiedWidget = { ...widget, serviceId, type: WidgetType.UNIFIED_RECOMMENDATIONS_MOVIE };
      event.dataTransfer?.setData('arrdeck/widget', JSON.stringify(unifiedWidget));
      event.dataTransfer?.setData('text/plain', JSON.stringify(unifiedWidget));
    } else {
      event.dataTransfer?.setData('arrdeck/widget', JSON.stringify({ ...widget, serviceId }));
      event.dataTransfer?.setData('text/plain', JSON.stringify({ ...widget, serviceId }));
    }
    event.dataTransfer!.effectAllowed = 'copy';
  }

  addSmartWidget(title: string, subType: string, icon: string) {
    this.dashboardService.addWidget({
      type: WidgetType.SMART_COLLECTION,
      title,
      icon,
      cols: 1,
      rows: 1,
      serviceId: subType
    });
  }
}
