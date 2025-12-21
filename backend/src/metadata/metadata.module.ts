import {Module} from '@nestjs/common';
import {MetadataController} from './metadata.controller';
import {MetadataService} from './metadata.service';
import {ServicesModule} from '../services/services.module';
import {TmdbModule} from '../integrations/tmdb/tmdb.module';
import {TraktModule} from '../integrations/trakt/trakt.module';

@Module({
    imports: [ServicesModule, TmdbModule, TraktModule],
    controllers: [MetadataController],
    providers: [MetadataService],
})
export class MetadataModule {
}
