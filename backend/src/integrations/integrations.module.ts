import { Module } from '@nestjs/common';
import { SonarrModule } from './sonarr/sonarr.module';
import { RadarrModule } from './radarr/radarr.module';
import { TraktModule } from './trakt/trakt.module';

@Module({
  imports: [SonarrModule, RadarrModule, TraktModule],
})
export class IntegrationsModule {}
