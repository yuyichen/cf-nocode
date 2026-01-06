interface RealtimeClientOptions {
  url?: string;
  userId?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface RealtimeMessage {
  type: 'join' | 'leave' | 'message' | 'ping' | 'pong' | 'data_change' | 'user_status' | 'error';
  room?: string;
  userId?: string;
  data?: any;
  timestamp: number;
}

interface RealtimeEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: RealtimeMessage) => void;
  onUserJoin?: (userId: string, room: string) => void;
  onUserLeave?: (userId: string, room: string) => void;
  onDataChange?: (table: string, action: string, data: any) => void;
  onError?: (error: Error) => void;
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private options: Required<RealtimeClientOptions>;
  private handlers: RealtimeEventHandlers;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private isDestroyed = false;
  private pingInterval: number | null = null;
  private rooms = new Set<string>();

  constructor(options: RealtimeClientOptions = {}, handlers: RealtimeEventHandlers = {}) {
    this.options = {
      url: options.url || `ws://${window.location.host}/ws`,
      userId: options.userId || this.generateUserId(),
      autoReconnect: options.autoReconnect !== false,
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      ...options
    };

    this.handlers = handlers;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isDestroyed) {
        reject(new Error('Client has been destroyed'));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      const wsUrl = `${this.options.url}?userId=${this.options.userId}`;
      
      try {
        this.ws = new WebSocket(wsUrl);

        const connectTimeout = setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
          
          this.rooms.forEach(room => {
            this.join(room);
          });

          this.handlers.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.stopPing();
          
          this.handlers.onDisconnect?.();

          if (!this.isDestroyed && this.options.autoReconnect && event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          const err = new Error('WebSocket connection failed');
          this.handlers.onError?.(err);
          reject(err);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isDestroyed = true;
    this.stopPing();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  join(room: string): void {
    if (!this.isConnected()) {
      this.rooms.add(room);
      return;
    }

    this.send({
      type: 'join',
      room,
      timestamp: Date.now()
    });
  }

  leave(room: string): void {
    this.rooms.delete(room);
    
    if (!this.isConnected()) {
      return;
    }

    this.send({
      type: 'leave',
      room,
      timestamp: Date.now()
    });
  }

  sendMessage(room: string, message: any): void {
    if (!this.isConnected()) {
      throw new Error('Not connected');
    }

    this.send({
      type: 'message',
      room,
      data: message,
      timestamp: Date.now()
    });
  }

  subscribeToTable(tableName: string): void {
    this.join(`table_${tableName}`);
  }

  unsubscribeFromTable(tableName: string): void {
    this.leave(`table_${tableName}`);
  }

  private handleMessage(message: RealtimeMessage): void {
    switch (message.type) {
      case 'pong':
        break;

      case 'join':
        if (message.data?.success) {
          this.rooms.add(message.room!);
        }
        break;

      case 'leave':
        this.rooms.delete(message.room!);
        break;

      case 'user_status':
        if (message.data?.status === 'joined') {
          this.handlers.onUserJoin?.(message.userId!, message.room!);
        } else if (message.data?.status === 'left' || message.data?.status === 'disconnected') {
          this.handlers.onUserLeave?.(message.userId!, message.room!);
        }
        break;

      case 'data_change':
        if (message.data?.table) {
          this.handlers.onDataChange?.(
            message.data.table,
            message.data.action,
            message.data.data
          );
        }
        break;

      case 'error':
        this.handlers.onError?.(new Error(message.data?.message || 'Unknown error'));
        break;

      default:
        this.handlers.onMessage?.(message);
    }
  }

  private send(message: RealtimeMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'ping',
          timestamp: Date.now()
        });
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.handlers.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, this.options.reconnectInterval);
  }

  private isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private generateUserId(): string {
    return 'client-' + Math.random().toString(36).substr(2, 9);
  }

  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'destroyed' {
    if (this.isDestroyed) return 'destroyed';
    if (this.isConnecting) return 'connecting';
    if (this.isConnected()) return 'connected';
    return 'disconnected';
  }

  getConnectedRooms(): string[] {
    return Array.from(this.rooms);
  }
}

// Vue 3 组合式 API
import { ref, readonly, onUnmounted } from 'vue';

export function useRealtime(options: RealtimeClientOptions = {}, handlers: RealtimeEventHandlers = {}) {
  const client = ref<RealtimeClient | null>(null);
  const status = ref<'connecting' | 'connected' | 'disconnected' | 'destroyed'>('disconnected');
  const rooms = ref<string[]>([]);

  const connect = async () => {
    if (!client.value) {
      client.value = new RealtimeClient(options, {
        onConnect: () => {
          status.value = 'connected';
          rooms.value = client.value!.getConnectedRooms();
          handlers.onConnect?.();
        },
        onDisconnect: () => {
          status.value = 'disconnected';
          rooms.value = [];
          handlers.onDisconnect?.();
        },
        onMessage: handlers.onMessage,
        onUserJoin: handlers.onUserJoin,
        onUserLeave: handlers.onUserLeave,
        onDataChange: handlers.onDataChange,
        onError: handlers.onError,
      });
    }

    try {
      await client.value.connect();
    } catch (error) {
      status.value = 'disconnected';
      throw error;
    }
  };

  const disconnect = () => {
    if (client.value) {
      client.value.disconnect();
      client.value = null;
    }
  };

  const join = (room: string) => {
    client.value?.join(room);
  };

  const leave = (room: string) => {
    client.value?.leave(room);
  };

  const sendMessage = (room: string, message: any) => {
    client.value?.sendMessage(room, message);
  };

  const subscribeToTable = (tableName: string) => {
    client.value?.subscribeToTable(tableName);
  };

  const unsubscribeFromTable = (tableName: string) => {
    client.value?.unsubscribeFromTable(tableName);
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    client: readonly(client),
    status: readonly(status),
    rooms: readonly(rooms),
    connect,
    disconnect,
    join,
    leave,
    sendMessage,
    subscribeToTable,
    unsubscribeFromTable,
  };
}