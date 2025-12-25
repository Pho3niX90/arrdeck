import {Component, effect, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ServiceConfig, ServicesService, ServiceType} from '../../services/services';

import {SonarrCalendarComponent} from '../../integrations/sonarr/components/sonarr-calendar.component';
import {SonarrRecentComponent} from '../../integrations/sonarr/components/sonarr-recent.component';
import {RadarrRecentComponent} from '../../integrations/radarr/components/radarr-recent.component';
import {RadarrRecommendedComponent} from '../../integrations/radarr/components/radarr-recommended.component';
import {TraktTrendingMoviesComponent} from '../../integrations/trakt/components/trakt-trending-movies.component';
import {UnifiedRecommendationsComponent} from '../../integrations/trakt/components/unified-recommendations.component';
import {TraktTrendingShowsComponent} from '../../integrations/trakt/components/trakt-trending-shows.component';
import {
  AiRecommendationsWidgetComponent
} from '../../components/ai-recommendations-widget/ai-recommendations-widget.component';
import {QueueWidgetComponent} from '../../components/queue-widget/queue-widget.component';

import {SmartCollectionWidget} from '../../components/smart-collection-widget/smart-collection-widget';

import {DisplayGrid, Gridster, GridsterConfig, GridsterItem} from 'angular-gridster2';
import {DashboardService, DashboardWidget, WidgetType} from './dashboard.service';
import {WidgetStoreComponent} from './components/widget-store.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    Gridster,
    GridsterItem,
    SonarrCalendarComponent,
    QueueWidgetComponent,
    SonarrRecentComponent,
    AiRecommendationsWidgetComponent,
    RadarrRecommendedComponent,
    RadarrRecentComponent,
    TraktTrendingMoviesComponent,
    TraktTrendingShowsComponent,
    UnifiedRecommendationsComponent,
    SmartCollectionWidget,
    WidgetStoreComponent
  ],
  templateUrl: './dashboard.html',
  styles: `
    gridster {
      background: transparent !important;
      display: block !important;
      pointer-events: auto !important;
      min-height: 100% !important;
    }

    gridster-item {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      transition: box-shadow 0.3s;
      /* Remove border-radius and overflow on the container so specific widgets control their own look */
    }

    /* When editing, show a subtle border or handle indication */
    gridster.scrollVertical.mobile gridster-item {
      /* Mobile styles if needed */
    }

    /* Dragging Preview */
    .gridster-item-resizable-handler {
      z-index: 100 !important; /* Ensure handles are above content */
      opacity: 0.5;
      cursor: pointer;
    }

    .gridster-preview {
      background: rgba(59, 130, 246, 0.2) !important;
      border: 1px dashed rgba(59, 130, 246, 0.5);
      border-radius: 1rem;
      z-index: 10 !important;
    }

    /* Resize Handles Customization - make them more visible in edit mode */
    .gridster-item-resizable-handler {
      opacity: 0.5; /* Always show slightly in edit mode? Or hover? Gridster handles this */
    }

    .gridster-item-resizable-handler:hover {
      background: rgba(59, 130, 246, 0.5); /* Highlight on hover */
    }

    .widget-actions {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 50;
      opacity: 0;
      transition: opacity 0.2s;
    }

    gridster-item:hover .widget-actions {
      opacity: 1;
    }
  `,
  encapsulation: ViewEncapsulation.None
})
export class Dashboard implements OnInit {
  private servicesService = inject(ServicesService);
  dashboardService = inject(DashboardService);

  // Enums for template access
  WidgetType = WidgetType;
  ServiceType = ServiceType;

  services = signal<ServiceConfig[]>([]);

  options: GridsterConfig = {};

  private baseOptions: GridsterConfig = {
    gridType: 'verticalFixed',
    compactType: 'none',
    margin: 24,
    outerMargin: true,
    outerMarginTop: null,
    outerMarginRight: null,
    outerMarginBottom: null,
    outerMarginLeft: null,
    useTransformPositioning: true,
    mobileBreakpoint: 640,
    minCols: 1,
    maxCols: 12,
    minRows: 12,
    defaultItemCols: 1,
    defaultItemRows: 1,
    fixedColWidth: 320,
    fixedRowHeight: 375,
    keepFixedHeightInMobile: true,
    keepFixedWidthInMobile: false,
    scrollSensitivity: 10,
    scrollSpeed: 20,
    enableEmptyCellDrop: false,
    enableOccupiedCellDrop: false,
    enableEmptyCellClick: false,
    enableEmptyCellContextMenu: false,
    enableEmptyCellDrag: false,
    emptyCellDragMaxCols: 50,
    emptyCellDragMaxRows: 50,
    ignoreMarginInRow: false,
    swap: false,
    pushItems: true,
    disablePushOnDrag: false,
    disablePushOnResize: false,
    pushDirections: {north: true, east: true, south: true, west: true},
    pushResizeItems: false,
    displayGrid: DisplayGrid.Always,
    disableWindowResize: false,
    disableWarnings: false,
    scrollToNewItems: false,
    itemChangeCallback: (item: any, itemComponent: GridsterItem) => {
      this.dashboardService.updateWidgetPosition(item as DashboardWidget);
    },
  };

  constructor() {
    this.servicesService.getServices()
      .subscribe(data => {
        this.services.set(data);
        this.initializeDefaultWidgets(data);
      });

    effect(() => {
      const edit = this.dashboardService.editMode();

      // Create a new options object to trigger change detection in Gridster
      this.options = {
        ...this.baseOptions,

        draggable: {
          enabled: edit,
          dropOverItems: false,
        },
        resizable: {
          enabled: edit,
          handles: {
            s: true, e: true, n: true, w: true,
            se: true, ne: true, sw: true, nw: true
          }
        },
        displayGrid: edit ? 'always' : 'none'
      };

      // Preserve API if it was already assigned (though Gridster should populate it on the new object too)
      if (this.options && this.options['api']) {
        (this.options as any)['api'] = this.options['api'];
      }

      // Try to notify if API exists (it might not on first run or since we replaced obj)
      if (this.options['api'] && this.options['api'].optionsChanged) {
        this.options['api'].optionsChanged();
      }
    });
  }

  ngOnInit() {
  }

  onDragOver(event: DragEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    event.preventDefault();
    event.stopPropagation();
  }

  onNativeDrop(event: DragEvent) {
    console.log('Native drop event:', event);
    event.preventDefault();
    event.stopPropagation();

    const dataString = event.dataTransfer?.getData('arrdeck/widget') || event.dataTransfer?.getData('text/plain');
    if (!dataString) {
      console.warn('No widget data found in native drop event');
      return;
    }

    try {
      const widget = JSON.parse(dataString);
      this.dashboardService.addWidget(widget);
    } catch (e) {
      console.error('Failed to parse widget data in native drop', e);
    }
  }

  initializeDefaultWidgets(services: ServiceConfig[]) {
    if (this.dashboardService.widgets().length > 0) return;
    let y = 0;

    services.forEach(service => {
      const sId = service.id;
      if (service.type === ServiceType.SONARR) {
        this.dashboardService.addWidget({
          type: WidgetType.SONARR_CALENDAR,
          serviceId: sId,
          serviceType: ServiceType.SONARR,
          cols: 1,
          rows: 1,
          x: 0,
          y: y,
          title: 'Calendar'
        });
        this.dashboardService.addWidget({
          type: WidgetType.QUEUE,
          serviceId: sId,
          serviceType: ServiceType.SONARR,
          cols: 1,
          rows: 1,
          x: 1,
          y: y,
          title: 'Queue'
        });
        this.dashboardService.addWidget({
          type: WidgetType.SONARR_RECENT,
          serviceId: sId,
          serviceType: ServiceType.SONARR,
          cols: 1,
          rows: 1,
          x: 2,
          y: y,
          title: 'Recent'
        });
        y += 1;
        this.dashboardService.addWidget({
          type: WidgetType.AI_RECOMMENDATIONS,
          serviceId: sId,
          serviceType: ServiceType.SONARR,
          cols: 1,
          rows: 1,
          x: 0,
          y: y,
          title: 'AI Recommendations'
        });
        y += 1;
      } else if (service.type === ServiceType.RADARR) {
        this.dashboardService.addWidget({
          type: WidgetType.RADARR_RECOMMENDED,
          serviceId: sId,
          serviceType: ServiceType.RADARR,
          cols: 1,
          rows: 1,
          x: 0,
          y: y,
          title: 'Recommended'
        });
        this.dashboardService.addWidget({
          type: WidgetType.QUEUE,
          serviceId: sId,
          serviceType: ServiceType.RADARR,
          cols: 1,
          rows: 1,
          x: 1,
          y: y,
          title: 'Queue'
        });
        this.dashboardService.addWidget({
          type: WidgetType.RADARR_RECENT,
          serviceId: sId,
          serviceType: ServiceType.RADARR,
          cols: 1,
          rows: 1,
          x: 2,
          y: y,
          title: 'Recent'
        });
        y += 1;
        this.dashboardService.addWidget({
          type: WidgetType.AI_RECOMMENDATIONS,
          serviceId: sId,
          serviceType: ServiceType.RADARR,
          cols: 1,
          rows: 1,
          x: 0,
          y: y,
          title: 'AI Recommendations'
        });
        y += 1;
      } else if (service.type === ServiceType.TRAKT) {
        this.dashboardService.addWidget({
          type: WidgetType.UNIFIED_RECOMMENDATIONS_MOVIE,
          serviceId: sId,
          cols: 1,
          rows: 1,
          x: 0,
          y: y,
          title: 'Movies'
        });
        this.dashboardService.addWidget({
          type: WidgetType.UNIFIED_RECOMMENDATIONS_SHOW,
          serviceId: sId,
          cols: 1,
          rows: 1,
          x: 1,
          y: y,
          title: 'Shows'
        });
        this.dashboardService.addWidget({
          type: WidgetType.TRAKT_TRENDING_MOVIES,
          serviceId: sId,
          cols: 1,
          rows: 1,
          x: 2,
          y: y,
          title: 'Trending Movies'
        });
        y += 1;
        this.dashboardService.addWidget({
          type: WidgetType.TRAKT_TRENDING_SHOWS,
          serviceId: sId,
          cols: 1,
          rows: 1,
          x: 0,
          y: y,
          title: 'Trending Shows'
        });
        y += 1;
      }
    });

    if (services.length > 0) {
      this.dashboardService.addWidget({
        type: WidgetType.SMART_COLLECTION,
        serviceId: 'underrated',
        cols: 1,
        rows: 1,
        x: 0,
        y: y,
        title: 'Underrated Gems',
        icon: '💎'
      });
      this.dashboardService.addWidget({
        type: WidgetType.SMART_COLLECTION,
        serviceId: 'marathon',
        cols: 1,
        rows: 1,
        x: 1,
        y: y,
        title: 'Marathon Worthy',
        icon: '🍿'
      });
      this.dashboardService.addWidget({
        type: WidgetType.SMART_COLLECTION,
        serviceId: 'quick',
        cols: 1,
        rows: 1,
        x: 2,
        y: y,
        title: 'Quick Watch',
        icon: '⚡'
      });
    }
  }

  isMovie(type: string | undefined): boolean {
    return type?.includes('movie') ?? false;
  }
}
