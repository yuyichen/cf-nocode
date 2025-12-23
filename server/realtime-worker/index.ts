export class RealtimeRoom {
  state: DurableObjectState;
  sessions: WebSocket[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());

    await this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(ws: WebSocket) {
    ws.accept();
    this.sessions.push(ws);

    ws.addEventListener('message', async (msg) => {
      try {
        // Broadcast incoming messages to all other connected clients
        this.broadcast(msg.data);
      } catch (err) {
        ws.send(JSON.stringify({ error: 'Failed to broadcast' }));
      }
    });

    ws.addEventListener('close', () => {
      this.sessions = this.sessions.filter((s) => s !== ws);
    });
  }

  broadcast(message: string | ArrayBuffer) {
    this.sessions.forEach((s) => {
      try {
        s.send(message);
      } catch (e) {
        // Clean up closed connections
        this.sessions = this.sessions.filter((session) => session !== s);
      }
    });
  }
}

export default {
  async fetch(request: Request, env: any) {
    const id = env.REALTIME_ROOM.idFromName('global-room');
    const obj = env.REALTIME_ROOM.get(id);
    return obj.fetch(request);
  },
};
