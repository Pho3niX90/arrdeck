import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServicesModule } from '../../services/services.module';
import { TraktService } from './trakt.service';
import { TraktController } from './trakt.controller';

@Module({
  imports: [HttpModule, ServicesModule],
  providers: [TraktService],
  controllers: [TraktController],
  exports: [TraktService],
})
export class TraktModule {}
