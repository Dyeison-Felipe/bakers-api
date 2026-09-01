import { Inject, Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'http';
import type WebSocket from 'ws';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { SessionNotifierService } from '@/shared/application/session/session-notifier.service';

type Connection = { socket: WebSocket; sessionId: string };

// Parser de cookie manual: o handshake do WS é atendido fora do pipeline do
// Fastify (a lib `ws` assume o upgrade HTTP direto), então @fastify/cookie
// não está disponível aqui — só o header cru mesmo.
function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }

  return null;
}

@Injectable()
@WebSocketGateway({ path: '/ws/session' })
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect, SessionNotifierService
{
  private readonly connectionsByUser = new Map<string, Set<Connection>>();
  private readonly userIdBySocket = new Map<WebSocket, string>();

  constructor(
    @Inject(PROVIDERS.JWT_SERVICE) private readonly jwtService: JwtService,
  ) {}

  async handleConnection(
    client: WebSocket,
    request: IncomingMessage,
  ): Promise<void> {
    const token = parseCookie(request.headers.cookie, AuthConstants.tokenName);
    const payload = token ? await this.jwtService.verifyJwt(token) : null;

    if (!payload?.sessionId) {
      client.close();
      return;
    }

    const connection: Connection = { socket: client, sessionId: payload.sessionId };

    if (!this.connectionsByUser.has(payload.sub)) {
      this.connectionsByUser.set(payload.sub, new Set());
    }
    this.connectionsByUser.get(payload.sub)!.add(connection);
    this.userIdBySocket.set(client, payload.sub);
  }

  handleDisconnect(client: WebSocket): void {
    const userId = this.userIdBySocket.get(client);
    if (!userId) return;

    const connections = this.connectionsByUser.get(userId);
    if (connections) {
      for (const connection of connections) {
        if (connection.socket === client) connections.delete(connection);
      }
      if (connections.size === 0) this.connectionsByUser.delete(userId);
    }

    this.userIdBySocket.delete(client);
  }

  invalidateOtherSessions(userId: string, currentSessionId: string): void {
    const connections = this.connectionsByUser.get(userId);
    if (!connections) return;

    for (const connection of connections) {
      if (connection.sessionId === currentSessionId) continue;

      connection.socket.send(
        JSON.stringify({
          type: 'SESSION_INVALIDATED',
          message: 'Sua conta foi acessada por outro dispositivo.',
        }),
      );
      connection.socket.close();
      connections.delete(connection);
    }
  }
}
