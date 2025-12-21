import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {EventsGateway} from './events.gateway';
import {ServicesService} from '../services/services.service';
import {SonarrService} from '../integrations/sonarr/sonarr.service';
import {RadarrService} from '../integrations/radarr/radarr.service';
import {ServiceType} from '../services/service.entity';

@Injectable()
export class EventsService implements OnModuleInit {
    private readonly logger = new Logger(EventsService.name);
    private pollingInterval: NodeJS.Timeout;

    constructor(
        private eventsGateway: EventsGateway,
        private servicesService: ServicesService,
        private sonarrService: SonarrService,
        private radarrService: RadarrService,
    ) {
    }

    onModuleInit() {
        this.startPolling();
    }

    private startPolling() {
        this.logger.log('Starting Queue Polling...');
        this.pollingInterval = setInterval(async () => {
            await this.checkQueues();
        }, 5000); // 5 seconds
    }

    private async checkQueues() {
        // Get all services
        const services = await this.servicesService.findAll();

        for (const service of services) {
            if (service.type === ServiceType.SONARR) {
                this.pollSonarr(service.id);
            } else if (service.type === ServiceType.RADARR) {
                this.pollRadarr(service.id);
            }
        }
    }

    private async pollSonarr(serviceId: number) {
        try {
            const queue = await this.sonarrService.getQueue(serviceId);
            this.eventsGateway.emitQueueUpdate(serviceId, queue);
        } catch (error) {
            this.logger.error(`Failed to poll Sonarr service ${serviceId}: ${error.message}`);
        }
    }

    private async pollRadarr(serviceId: number) {
        try {
            const queue = await this.radarrService.getQueue(serviceId);
            this.eventsGateway.emitQueueUpdate(serviceId, queue);
        } catch (error) {
            this.logger.error(`Failed to poll Radarr service ${serviceId}: ${error.message}`);
        }
    }
}
