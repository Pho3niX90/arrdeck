import {Module} from '@nestjs/common';
import {StatsController} from './stats.controller';
import {StatsService} from './stats.service';
import {ServicesModule} from '../services/services.module';
import {IntegrationsModule} from '../integrations/integrations.module';

@Module({
    imports: [ServicesModule, IntegrationsModule],
    controllers: [StatsController],
    providers: [StatsService],
})
export class StatsModule {
}
