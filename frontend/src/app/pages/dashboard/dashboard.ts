import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceConfig, ServicesService } from '../../services/services';
import { SonarrCalendarComponent } from '../../integrations/sonarr/components/sonarr-calendar.component';
import { SonarrRecentComponent } from '../../integrations/sonarr/components/sonarr-recent.component';
import { RadarrRecentComponent } from '../../integrations/radarr/components/radarr-recent.component';
import { RadarrRecommendedComponent } from '../../integrations/radarr/components/radarr-recommended.component';
import { TraktTrendingMoviesComponent } from '../../integrations/trakt/components/trakt-trending-movies.component';
import { UnifiedRecommendationsComponent } from '../../integrations/trakt/components/unified-recommendations.component';
import { TraktTrendingShowsComponent } from '../../integrations/trakt/components/trakt-trending-shows.component';
import {
  AiRecommendationsWidgetComponent
} from '../../components/ai-recommendations-widget/ai-recommendations-widget.component';
import { QueueWidgetComponent } from '../../components/queue-widget/queue-widget.component';


import { SmartCollectionWidget } from '../../components/smart-collection-widget/smart-collection-widget';

import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SonarrCalendarComponent,
    QueueWidgetComponent,
    SonarrRecentComponent,
    AiRecommendationsWidgetComponent,
    RadarrRecommendedComponent,
    RadarrRecentComponent,
    TraktTrendingMoviesComponent,
    TraktTrendingShowsComponent,
    UnifiedRecommendationsComponent,
    SmartCollectionWidget
  ],
  templateUrl: './dashboard.html',
  styles: ``,
  animations: [
    trigger('fadeInStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class Dashboard {
  private servicesService = inject(ServicesService);
  services = signal<ServiceConfig[]>([]);

  constructor() {
    this.servicesService.getServices().subscribe(data => {
      this.services.set(data);
    });
  }
}
