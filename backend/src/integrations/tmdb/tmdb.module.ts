import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../../services/service.entity';
import { TmdbController } from './tmdb.controller';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [TmdbController],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
