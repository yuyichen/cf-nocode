interface ClientSession {
  ws: WebSocket;
  userId?: string;
  rooms: Set<string>;
  lastPing: number;
}

interface RealtimeMessage {
  type: 'join' | 'leave' | 'message' | 'ping' | 'pong' | 'data_change' | 'user_status' | 'error';
  room?: string;
  userId?: string;
  data?: any;
  timestamp: number;
}

export class RealtimeRoom {
  state: any;
  sessions: Map<string, ClientSession> = new Map();
  roomMembers: Map<string, Set<string>> = new Map();

  constructor(state: any) {
    this.state = state;
    this.initializeFromStorage();
  }

  private async initializeFromStorage() {
    try {
      const roomData = await this.state.storage.get('roomMembers');
      if (roomData) {
        this.roomMembers = new Map(JSON.parse(roomData as string));
      }
    } catch (error) {
      console.error('Failed to initialize from storage:', error);
    }
  }

  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    
    if (request.method !== 'GET' || url.pathname !== '/ws') {
      return this.handleAPIRequest(request);
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const userId = url.searchParams.get('userId') || 
                   request.headers.get('X-User-ID') || 
                   'anonymous-' + crypto.randomUUID();

    const pair = new (globalThis as any).WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    
    const sessionId = crypto.randomUUID();
    const session: ClientSession = {
      ws: server as any,
      userId,
      rooms: new Set(),
      lastPing: Date.now()
    };

    this.sessions.set(sessionId, session);
    await this.handleSession(sessionId, session);

    return new Response(null, {
      status: 101,
      webSocket: client,
    } as any);
  }

  private async handleSession(sessionId: string, session: ClientSession) {
    const { ws, userId } = session;
    
    (ws as any).accept();

    this.sendToSession(session, {
      type: 'user_status',
      userId,
      data: { status: 'connected', sessionId },
      timestamp: Date.now()
    });

    const pingInterval = setInterval(() => {
      if (Date.now() - session.lastPing > 30000) {
        this.removeSession(sessionId);
        clearInterval(pingInterval);
      } else {
        this.sendToSession(session, {
          type: 'ping',
          timestamp: Date.now()
        });
      }
    }, 15000);

    ws.addEventListener('message', async (msg) => {
      try {
        const message: RealtimeMessage = JSON.parse(msg.data as string);
        session.lastPing = Date.now();

        switch (message.type) {
          case 'ping':
            this.sendToSession(session, {
              type: 'pong',
              timestamp: Date.now()
            });
            break;

          case 'join':
            await this.joinRoom(sessionId, message.room || 'default');
            break;

          case 'leave':
            await this.leaveRoom(sessionId, message.room || 'default');
            break;

          case 'message':
            await this.handleChatMessage(session, message);
            break;

          case 'data_change':
            await this.handleDataChange(session, message);
            break;

          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('Failed to handle message:', err);
        this.sendToSession(session, {
          type: 'error',
          data: { message: 'Failed to process message' },
          timestamp: Date.now()
        });
      }
    });

    ws.addEventListener('close', () => {
      clearInterval(pingInterval);
      this.removeSession(sessionId);
    });

    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.removeSession(sessionId);
    });
  }

  private async joinRoom(sessionId: string, roomName: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.rooms.add(roomName);
    
    if (!this.roomMembers.has(roomName)) {
      this.roomMembers.set(roomName, new Set());
    }
    this.roomMembers.get(roomName)!.add(sessionId);

    await this.persistRoomData();

    this.broadcastToRoom(roomName, {
      type: 'user_status',
      userId: session.userId,
      data: { status: 'joined', room: roomName },
      timestamp: Date.now()
    }, sessionId);

    this.sendToSession(session, {
      type: 'join',
      room: roomName,
      data: { success: true, memberCount: this.roomMembers.get(roomName)?.size || 0 },
      timestamp: Date.now()
    });
  }

  private async leaveRoom(sessionId: string, roomName: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.rooms.delete(roomName);
    const roomMembers = this.roomMembers.get(roomName);
    if (roomMembers) {
      roomMembers.delete(sessionId);
      if (roomMembers.size === 0) {
        this.roomMembers.delete(roomName);
      }
    }

    await this.persistRoomData();

    this.broadcastToRoom(roomName, {
      type: 'user_status',
      userId: session.userId,
      data: { status: 'left', room: roomName },
      timestamp: Date.now()
    }, sessionId);
  }

  private async handleChatMessage(session: ClientSession, message: RealtimeMessage) {
    const roomName = message.room || 'default';
    
    this.broadcastToRoom(roomName, {
      type: 'message',
      userId: session.userId,
      room: roomName,
      data: message.data,
      timestamp: Date.now()
    });
  }

  private async handleDataChange(session: ClientSession, message: RealtimeMessage) {
    const { table, recordId, action, data } = message.data || {};
    
    if (!table) return;

    const roomName = `table_${table}`;
    this.broadcastToRoom(roomName, {
      type: 'data_change',
      userId: session.userId,
      data: {
        table,
        recordId,
        action,
        data,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });
  }

  private sendToSession(session: ClientSession, message: RealtimeMessage) {
    try {
      session.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message to session:', error);
    }
  }

  private broadcastToRoom(roomName: string, message: RealtimeMessage, excludeSessionId?: string) {
    const roomMembers = this.roomMembers.get(roomName);
    if (!roomMembers) return;

    roomMembers.forEach(sessionId => {
      if (sessionId !== excludeSessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
          this.sendToSession(session, message);
        }
      }
    });
  }

  private removeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.rooms.forEach(roomName => {
      const roomMembers = this.roomMembers.get(roomName);
      if (roomMembers) {
        roomMembers.delete(sessionId);
        if (roomMembers.size === 0) {
          this.roomMembers.delete(roomName);
        }
        
        this.broadcastToRoom(roomName, {
          type: 'user_status',
          userId: session.userId,
          data: { status: 'disconnected', room: roomName },
          timestamp: Date.now()
        });
      }
    });

    this.sessions.delete(sessionId);
    this.persistRoomData();
  }

  private async persistRoomData() {
    try {
      const roomData = JSON.stringify(Array.from(this.roomMembers.entries()));
      await this.state.storage.put('roomMembers', roomData);
    } catch (error) {
      console.error('Failed to persist room data:', error);
    }
  }

  private async handleAPIRequest(request: Request) {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/status':
        return new Response(JSON.stringify({
          activeSessions: this.sessions.size,
          activeRooms: this.roomMembers.size,
          rooms: Array.from(this.roomMembers.entries()).map(([name, members]) => ({
            name,
            memberCount: members.size
          }))
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

      case '/broadcast':
        if (request.method === 'POST') {
          const { room, message } = await request.json() as any;
          this.broadcastToRoom(room || 'default', {
            type: 'message',
            data: message,
            timestamp: Date.now()
          });
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        break;

      default:
        return new Response('Not Found', { status: 404 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  }

  async notifyDataChange(table: string, action: string, recordId?: string, data?: any) {
    const roomName = `table_${table}`;
    this.broadcastToRoom(roomName, {
      type: 'data_change',
      userId: 'system',
      data: {
        table,
        recordId,
        action,
        data,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });
  }

  getRoomStats() {
    return {
      totalSessions: this.sessions.size,
      totalRooms: this.roomMembers.size,
      rooms: Array.from(this.roomMembers.entries()).map(([name, members]) => ({
        name,
        memberCount: members.size,
        members: Array.from(members).map(sessionId => {
          const session = this.sessions.get(sessionId);
          return session ? { userId: session.userId } : null;
        }).filter(Boolean)
      }))
    };
  }
}

export default {
  async fetch(request: Request, env: any) {
    const id = env.REALTIME_ROOM.idFromName('global-room');
    const obj = env.REALTIME_ROOM.get(id);
    return obj.fetch(request, env);
  },
};