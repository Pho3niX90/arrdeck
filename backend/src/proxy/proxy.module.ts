import { Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';
import { HttpModule } from '@nestjs/axios';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [HttpModule, ServicesModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
