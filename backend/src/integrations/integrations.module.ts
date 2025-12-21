import {Module} from '@nestjs/common';
import {SonarrModule} from './sonarr/sonarr.module';
import {RadarrModule} from './radarr/radarr.module';
import {TraktModule} from './trakt/trakt.module';
import {TmdbModule} from './tmdb/tmdb.module';

@Module({
    imports: [SonarrModule, RadarrModule, TraktModule, TmdbModule],
    exports: [SonarrModule, RadarrModule, TraktModule, TmdbModule],
})
export class IntegrationsModule {
}
