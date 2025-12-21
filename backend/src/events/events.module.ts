import {Module} from '@nestjs/common';
import {EventsGateway} from './events.gateway';
import {EventsService} from './events.service';
import {ServicesModule} from '../services/services.module';
import {SonarrModule} from '../integrations/sonarr/sonarr.module';
import {RadarrModule} from '../integrations/radarr/radarr.module';

@Module({
    imports: [ServicesModule, SonarrModule, RadarrModule],
    providers: [EventsGateway, EventsService],
    exports: [EventsGateway],
})
export class EventsModule {
}
