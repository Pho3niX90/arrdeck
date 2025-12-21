import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { AiModule } from './ai/ai.module';
import { User } from './users/user.entity';
import { Service } from './services/service.entity';
import { ProxyModule } from './proxy/proxy.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { EventsModule } from './events/events.module';
import { MetadataModule } from './metadata/metadata.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      ttl: 300000, // 5 minutes
      isGlobal: true,
    }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const clientPath = configService.get(
          'CLIENT_PATH',
          '../frontend/dist/ArrDeck/browser',
        );
        // Fix for absolute paths (e.g. Docker) vs relative paths (Dev)
        const rootPath = clientPath.startsWith('/')
          ? clientPath
          : join(__dirname, '..', clientPath);
        return [
          {
            rootPath,
            exclude: ['/api/{*path}'],
          },
        ];
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'arrdeck'),
        password: configService.get<string>('DB_PASSWORD', 'arrdeck'),
        database: configService.get<string>('DB_DATABASE', 'arrdeck'),
        entities: [User, Service],
        synchronize: true, // Auto-create tables (dev only, good for MVP)
      }),
    }),
    UsersModule,
    AuthModule,
    ServicesModule,
    ProxyModule,
    IntegrationsModule,
    AiModule,
    EventsModule,
    MetadataModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
