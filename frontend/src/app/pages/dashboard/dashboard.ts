import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicesService, ServiceConfig } from '../../services/services';
import { SonarrCalendarComponent } from '../../integrations/sonarr/components/sonarr-calendar.component';
import { SonarrRecentComponent } from '../../integrations/sonarr/components/sonarr-recent.component';
import { RadarrRecentComponent } from '../../integrations/radarr/components/radarr-recent.component';
import { RadarrRecommendedComponent } from '../../integrations/radarr/components/radarr-recommended.component';
import { TraktTrendingMoviesComponent } from '../../integrations/trakt/components/trakt-trending-movies.component';
import { UnifiedRecommendationsComponent } from '../../integrations/trakt/components/unified-recommendations.component';
import { TraktTrendingShowsComponent } from '../../integrations/trakt/components/trakt-trending-shows.component';
import { AiRecommendationsWidgetComponent } from '../../components/ai-recommendations-widget/ai-recommendations-widget.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SonarrCalendarComponent, SonarrRecentComponent, RadarrRecentComponent, RadarrRecommendedComponent, TraktTrendingMoviesComponent, TraktTrendingShowsComponent, UnifiedRecommendationsComponent, AiRecommendationsWidgetComponent],
  templateUrl: './dashboard.html',
  styles: ``
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
