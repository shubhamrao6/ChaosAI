import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface WebSocketMessage {
  sessionId?: string;
  jobId?: string;
  status: string;
  command?: string;
  line?: string;
  exitCode?: number;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  sessionId?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private readonly serverUrl = 'ws://40.76.252.88:8765/ws';
  
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({ connected: false });
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  private messageSubject = new Subject<WebSocketMessage>();
  public messages$ = this.messageSubject.asObservable();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Attempting to connect to WebSocket:', this.serverUrl);
    
    try {
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.connectionStatusSubject.next({ connected: true, error: undefined });
      };

      this.ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.sessionId && message.status === 'connected') {
            console.log('Session established:', message.sessionId);
            this.connectionStatusSubject.next({ 
              connected: true, 
              sessionId: message.sessionId 
            });
          }
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.connectionStatusSubject.next({ connected: false });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatusSubject.next({ 
          connected: false, 
          error: 'Connection failed' 
        });
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionStatusSubject.next({ 
        connected: false, 
        error: 'Failed to connect' 
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.connectionStatusSubject.next({ 
        connected: false, 
        error: `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})` 
      });
      
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay);
    } else {
      this.connectionStatusSubject.next({ 
        connected: false, 
        error: 'Max reconnection attempts reached' 
      });
    }
  }

  sendCommand(command: string): void {
    console.log('Attempting to send command:', command);
    console.log('WebSocket state:', this.ws?.readyState);
    console.log('WebSocket URL:', this.serverUrl);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'run',
        command: command
      };
      try {
        const messageStr = JSON.stringify(message);
        console.log('Sending WebSocket message:', messageStr);
        this.ws.send(messageStr);
        console.log('Command sent successfully:', command);
      } catch (error) {
        console.error('Failed to send command:', error);
        this.messageSubject.next({
          status: 'error',
          error: 'Failed to send command to server'
        });
      }
    } else {
      console.error('WebSocket is not connected. State:', this.ws?.readyState);
      this.messageSubject.next({
        status: 'error',
        error: 'Not connected to server'
      });
    }
  }

  killJob(jobId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'kill',
        jobId: jobId
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  checkJobStatus(jobId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'status',
        jobId: jobId
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatusSubject.next({ connected: false });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  forceReconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}