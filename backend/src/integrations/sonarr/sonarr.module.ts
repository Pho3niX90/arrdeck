import { Module } from '@nestjs/common';
import { SonarrService } from './sonarr.service';
import { SonarrController } from './sonarr.controller';
import { HttpModule } from '@nestjs/axios';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [HttpModule, ServicesModule],
  controllers: [SonarrController],
  providers: [SonarrService],
  exports: [SonarrService],
})
export class SonarrModule {}
