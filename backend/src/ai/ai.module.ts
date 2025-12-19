import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { SonarrModule } from '../integrations/sonarr/sonarr.module';
import { RadarrModule } from '../integrations/radarr/radarr.module';
import { ConfigModule } from '@nestjs/config';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    SonarrModule,
    RadarrModule,
    ServicesModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
