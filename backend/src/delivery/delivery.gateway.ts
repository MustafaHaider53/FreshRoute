import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface SocketJwtPayload {
  sub: string;
  role: string;
}

@WebSocketGateway({
  namespace: '/delivery',
  cors: { origin: '*' },
})
export class DeliveryGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const authorization = client.handshake.headers.authorization;
    const headerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
    const handshakeAuth = client.handshake.auth as Record<string, unknown>;
    const authToken =
      typeof handshakeAuth.token === 'string' ? handshakeAuth.token : undefined;
    const token = authToken || headerToken;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<SocketJwtPayload>(token);
      await client.join(`user:${payload.sub}`);
      await client.join(`role:${payload.role}`);
    } catch {
      client.disconnect(true);
    }
  }

  emitDeliveryAssigned(driverId: string, payload: unknown) {
    this.server.to(`user:${driverId}`).emit('delivery_assigned', payload);
  }

  emitStopUpdated(buyerId: string, payload: unknown) {
    this.server.to(`user:${buyerId}`).emit('delivery_stop_updated', payload);
  }
}
