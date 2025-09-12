import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthService } from './auth';
import { WebSocketService, WebSocketMessage } from './websocket';

export interface TerminalCommand {
  command: string;
  output: string;
  timestamp: Date;
  type: 'command' | 'output' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class TerminalService {
  private commandHistorySubject = new BehaviorSubject<TerminalCommand[]>([]);
  public commandHistory$ = this.commandHistorySubject.asObservable();

  private currentDirectory = '/home/kali';
  private isConnected = false;
  private userName = 'kali';
  private useRemoteServer = true;
  private currentJobId: string | null = null;



  constructor(
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {
    // Set username first
    const user = this.authService.getCurrentUser();
    this.userName = user?.firstName?.toLowerCase() || 'kali';
    
    this.initializeTerminal();
    this.setupWebSocketConnection();
  }

  private initializeTerminal() {
    const welcomeMessage: TerminalCommand = {
      command: '',
      output: `┌──(kali㉿${this.userName})-[~]
└─$ Welcome to ChaosAI Terminal
└─$ Connecting to remote Kali Linux server...
└─$ Type 'help' for available commands`,
      timestamp: new Date(),
      type: 'output'
    };
    
    this.commandHistorySubject.next([welcomeMessage]);
  }

  private setupWebSocketConnection() {
    // Connect to WebSocket server
    this.webSocketService.connect();
    
    // Listen for connection status changes
    this.webSocketService.connectionStatus$.subscribe(status => {
      console.log('Connection status changed:', status);
      this.isConnected = status.connected;
      
      if (status.connected && status.sessionId) {
        this.addSystemMessage(`Connected to Kali Linux server (Session: ${status.sessionId.substring(0, 8)}...)`);
      } else if (!status.connected && status.error) {
        this.addSystemMessage(`Connection failed: ${status.error}`);
      }
    });
    
    // Listen for WebSocket messages
    this.webSocketService.messages$.subscribe(message => {
      this.handleWebSocketMessage(message);
    });
  }

  private addSystemMessage(message: string) {
    const systemMessage: TerminalCommand = {
      command: '',
      output: `└─$ ${message}`,
      timestamp: new Date(),
      type: 'output'
    };
    
    const currentHistory = this.commandHistorySubject.value;
    this.commandHistorySubject.next([...currentHistory, systemMessage]);
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    console.log('Handling WebSocket message:', message);
    
    if (message.jobId === this.currentJobId) {
      if (message.line) {
        console.log('Adding output line to terminal:', message.line);
        // Add real-time output
        const outputEntry: TerminalCommand = {
          command: '',
          output: message.line,
          timestamp: new Date(),
          type: message.status === 'error' ? 'error' : 'output'
        };
        
        const currentHistory = this.commandHistorySubject.value;
        this.commandHistorySubject.next([...currentHistory, outputEntry]);
      }
      
      if (message.status === 'done' || message.status === 'killed') {
        console.log('Job finished, clearing currentJobId');
        this.currentJobId = null;
        if (message.exitCode !== undefined && message.exitCode !== 0) {
          this.addSystemMessage(`Command exited with code: ${message.exitCode}`);
        }
      }
    }
  }

  executeCommand(command: string): Observable<TerminalCommand> {
    return new Observable(observer => {
      const trimmedCommand = command.trim();
      console.log('Terminal executing command:', trimmedCommand);
      
      // Check if there's already a running job
      if (this.currentJobId) {
        console.log('Command blocked - job already running:', this.currentJobId);
        this.addSystemMessage('Please wait for current command to complete');
        observer.complete();
        return;
      }
      
      // Add command to history
      const commandEntry: TerminalCommand = {
        command: `┌──(kali㉿${this.userName})-[${this.currentDirectory}]
└─$ ${trimmedCommand}`,
        output: '',
        timestamp: new Date(),
        type: 'command'
      };

      const currentHistory = this.commandHistorySubject.value;
      this.commandHistorySubject.next([...currentHistory, commandEntry]);

      // Handle special commands
      if (trimmedCommand === 'clear') {
        this.commandHistorySubject.next([]);
        observer.complete();
        return;
      }

      if (trimmedCommand === 'exit') {
        this.webSocketService.disconnect();
        this.isConnected = false;
        this.addSystemMessage('Connection closed.');
        observer.complete();
        return;
      }

      // Execute command on remote server
      if (this.webSocketService.isConnected()) {
        console.log('Executing on remote server');
        this.executeRemoteCommand(trimmedCommand, observer);
      } else {
        console.log('Not connected to server');
        this.addSystemMessage('Not connected to server');
        observer.complete();
      }
    });
  }

  private executeRemoteCommand(command: string, observer: any) {
    console.log('Starting remote command execution:', command);
    
    // Send command to server first
    this.webSocketService.sendCommand(command);
    
    // Listen for all WebSocket messages for this command
    const messageSubscription = this.webSocketService.messages$.subscribe(message => {
      console.log('Received message for command:', message);
      
      if (message.status === 'started' && message.jobId && message.command === command) {
        console.log('Job started:', message.jobId);
        this.currentJobId = message.jobId;
        this.addSystemMessage(`Job started: ${message.jobId.substring(0, 8)}`);
      } else if (message.jobId === this.currentJobId) {
        if (message.status === 'running' && message.line) {
          console.log('Received output line:', message.line);
          // Real-time output streaming - already handled in handleWebSocketMessage
        } else if (message.status === 'error' && message.line) {
          console.log('Received error line:', message.line);
          // Error output streaming - already handled in handleWebSocketMessage  
        } else if (message.status === 'done') {
          console.log('Job completed:', message.exitCode);
          if (message.exitCode !== undefined) {
            this.addSystemMessage(`Command completed with exit code: ${message.exitCode}`);
          } else {
            this.addSystemMessage('Command completed successfully');
          }
          this.currentJobId = null;
          messageSubscription.unsubscribe();
          observer.complete();
        } else if (message.status === 'killed') {
          console.log('Job was killed');
          this.addSystemMessage('Command was killed');
          this.currentJobId = null;
          messageSubscription.unsubscribe();
          observer.complete();
        }
      } else if (message.error && !message.jobId) {
        console.log('Server error:', message.error);
        // General error not related to a specific job
        this.addSystemMessage(`Server error: ${message.error}`);
        messageSubscription.unsubscribe();
        observer.complete();
      }
    });
    
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (messageSubscription && !messageSubscription.closed) {
        console.log('Command execution timeout after 30 seconds');
        this.addSystemMessage('Command execution timeout');
        this.currentJobId = null;
        messageSubscription.unsubscribe();
        observer.complete();
      }
    }, 30000); // 30 second timeout
    
    // Clear timeout when subscription completes
    messageSubscription.add(() => {
      clearTimeout(timeoutId);
    });
  }



  clearHistory(): void {
    this.commandHistorySubject.next([]);
  }

  getCurrentDirectory(): string {
    return this.currentDirectory;
  }

  isTerminalConnected(): boolean {
    return this.isConnected;
  }

  getConnectionStatus(): Observable<any> {
    return this.webSocketService.connectionStatus$;
  }

  killCurrentJob(): void {
    if (this.currentJobId) {
      console.log('Killing current job:', this.currentJobId);
      this.webSocketService.killJob(this.currentJobId);
      this.addSystemMessage(`Killing job: ${this.currentJobId.substring(0, 8)}...`);
    } else {
      console.log('No job to kill');
    }
  }

  hasRunningJob(): boolean {
    return this.currentJobId !== null;
  }

  reconnectWebSocket(): void {
    console.log('Reconnecting WebSocket...');
    this.addSystemMessage('Reconnecting to server...');
    this.currentJobId = null; // Clear any running job
    this.webSocketService.forceReconnect();
  }
}