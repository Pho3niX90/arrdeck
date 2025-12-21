import {OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer,} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {Logger} from '@nestjs/common';
import {SonarrQueueResponse} from '../integrations/sonarr/sonarr.models';
import {RadarrQueueResponse} from '../integrations/radarr/radarr.models';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('EventsGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    emitQueueUpdate(serviceId: number, data: SonarrQueueResponse | RadarrQueueResponse) {
        this.server.emit(`queueUpdate:${serviceId}`, data);
    }
}
