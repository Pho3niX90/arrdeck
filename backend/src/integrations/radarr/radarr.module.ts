import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServicesModule } from '../../services/services.module';
import { RadarrService } from './radarr.service';
import { RadarrController } from './radarr.controller';

@Module({
  imports: [HttpModule, ServicesModule],
  providers: [RadarrService],
  controllers: [RadarrController],
  exports: [RadarrService],
})
export class RadarrModule {}
