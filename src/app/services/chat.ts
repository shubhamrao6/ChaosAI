import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthService } from './auth';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  type: 'text' | 'command' | 'analysis';
  timestamp: Date;
  liked?: boolean;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: 'aws' | 'azure';
  tier: 'basic' | 'premium';
  description: string;
  cost: string;
}

export interface ChatResponse {
  type: 'start' | 'chunk' | 'end' | 'history' | 'error' | 'clear_history';
  text?: string;
  message?: string;
  messages?: ChatMessage[];
  has_more?: boolean;
  total_count?: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private ws: WebSocket | null = null;
  private readonly serverUrl = 'wss://jyukhbg024.execute-api.us-east-1.amazonaws.com/prod';
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();
  
  private isTypingSubject = new BehaviorSubject<boolean>(false);
  public isTyping$ = this.isTypingSubject.asObservable();

  private currentStreamingMessage = '';
  private currentStreamingId = '';
  private historyOffset = 0;
  
  private hasMoreHistorySubject = new BehaviorSubject<boolean>(false);
  public hasMoreHistory$ = this.hasMoreHistorySubject.asObservable();

  public readonly availableModels: ChatModel[] = [
    {
      id: 'basic',
      name: 'Claude 3 Haiku',
      provider: 'aws',
      tier: 'basic',
      description: 'Fast, cost-effective',
      cost: '$0.38/1000 messages'
    },
    {
      id: 'premium',
      name: 'Claude 3.5 Sonnet',
      provider: 'aws',
      tier: 'premium',
      description: 'Advanced reasoning',
      cost: '$4.50/1000 messages'
    },
    {
      id: 'basic',
      name: 'GPT-4o Mini',
      provider: 'azure',
      tier: 'basic',
      description: 'Multimodal, competitive',
      cost: '$0.54/1000 messages'
    },
    {
      id: 'premium',
      name: 'GPT-4o',
      provider: 'azure',
      tier: 'premium',
      description: 'Best multimodal capabilities',
      cost: '$6.25/1000 messages'
    }
  ];

  constructor(private authService: AuthService) {
    this.initializeChat();
  }

  private initializeChat() {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'ai',
      content: 'Welcome to **ChaosAI** - Your AI-Powered Penetration Testing Assistant!\n\nI\'m here to help you with:\n\n• **Network Reconnaissance** - Port scanning, service enumeration\n• **Vulnerability Assessment** - Security weakness identification\n• **Exploit Development** - Attack vector suggestions\n• **Security Analysis** - Risk assessment and reporting\n• **Command Assistance** - Terminal command recommendations\n\nSelect your preferred AI model from the dropdown below and start your security testing journey. What would you like to explore today?',
      type: 'text',
      timestamp: new Date()
    };
    
    console.log('Initializing chat with welcome message:', welcomeMessage);
    this.messagesSubject.next([welcomeMessage]);
  }

  connect(): void {
    const idToken = this.authService.getIdToken();
    if (!idToken) {
      console.error('No ID token available for chat connection');
      // Add a test message to verify display is working
      const testMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'system',
        content: 'No authentication token available. Please log in to use chat features.',
        type: 'text',
        timestamp: new Date()
      };
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, testMessage]);
      return;
    }

    const wsUrl = `${this.serverUrl}?token=${idToken}`;
    console.log('Connecting to chat WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Chat WebSocket connected');
        this.isConnectedSubject.next(true);
        // Connection successful, just load history without extra message
        this.loadHistory();
      };

      this.ws.onmessage = (event) => {
        try {
          const response: ChatResponse = JSON.parse(event.data);
          this.handleResponse(response);
        } catch (error) {
          console.error('Failed to parse chat response:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Chat WebSocket closed');
        this.isConnectedSubject.next(false);
        const disconnectMessage: ChatMessage = {
          id: this.generateId(),
          sender: 'system',
          content: 'Disconnected from chat service.',
          type: 'text',
          timestamp: new Date()
        };
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, disconnectMessage]);
      };

      this.ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        this.isConnectedSubject.next(false);
        const errorMessage: ChatMessage = {
          id: this.generateId(),
          sender: 'system',
          content: 'Connection error occurred. Please check your internet connection.',
          type: 'text',
          timestamp: new Date()
        };
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, errorMessage]);
      };

    } catch (error) {
      console.error('Failed to create chat WebSocket:', error);
    }
  }

  private handleResponse(response: ChatResponse) {
    const currentMessages = this.messagesSubject.value;

    switch (response.type) {
      case 'start':
        this.isTypingSubject.next(true);
        this.currentStreamingMessage = '';
        this.currentStreamingId = this.generateId();
        break;

      case 'chunk':
        if (response.text) {
          this.currentStreamingMessage += response.text;
          this.updateStreamingMessage();
        }
        break;

      case 'end':
        this.isTypingSubject.next(false);
        this.finalizeStreamingMessage();
        break;

      case 'history':
        console.log('Received history response:', response);
        if (response.messages && response.messages.length > 0) {
          // Convert API messages to ChatMessage format
          const formattedMessages: ChatMessage[] = response.messages.map((msg: any) => ({
            id: msg.id || this.generateId(),
            sender: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content || msg.message || 'Empty message',
            type: msg.type || 'text',
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }));

          console.log('Formatted messages:', formattedMessages);
          const currentMessages = this.messagesSubject.value;
          // If this is initial load (only welcome message), replace with history
          if (currentMessages.length <= 1 && currentMessages[0]?.sender === 'ai' && currentMessages[0]?.content.includes('Welcome')) {
            this.messagesSubject.next(formattedMessages);
          } else {
            // Prepend older messages for pagination
            this.messagesSubject.next([...formattedMessages, ...currentMessages]);
          }
          this.hasMoreHistorySubject.next(response.has_more || false);
          this.historyOffset += formattedMessages.length;
        } else {
          // No history available, keep welcome message
          console.log('No history messages received, keeping welcome message');
          this.hasMoreHistorySubject.next(false);
        }
        break;

      case 'clear_history':
        // Ignore any response from clear_history to prevent unwanted LLM responses
        console.log('History cleared on server');
        break;

      case 'error':
        this.isTypingSubject.next(false);
        const errorMessage: ChatMessage = {
          id: this.generateId(),
          sender: 'system',
          content: `Error: ${response.error}`,
          type: 'text',
          timestamp: new Date()
        };
        this.messagesSubject.next([...currentMessages, errorMessage]);
        break;
    }
  }

  private updateStreamingMessage() {
    const currentMessages = this.messagesSubject.value;
    const existingIndex = currentMessages.findIndex(m => m.id === this.currentStreamingId);
    
    const streamingMessage: ChatMessage = {
      id: this.currentStreamingId,
      sender: 'ai',
      content: this.currentStreamingMessage,
      type: 'text',
      timestamp: new Date()
    };

    if (existingIndex >= 0) {
      const updatedMessages = [...currentMessages];
      updatedMessages[existingIndex] = streamingMessage;
      this.messagesSubject.next(updatedMessages);
    } else {
      this.messagesSubject.next([...currentMessages, streamingMessage]);
    }
  }

  private finalizeStreamingMessage() {
    // Message is already in place from streaming updates
    this.currentStreamingMessage = '';
    this.currentStreamingId = '';
  }

  sendMessage(message: string, modelId: string = 'basic', provider: 'aws' | 'azure' = 'aws'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Chat WebSocket not connected');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'user',
      content: message,
      type: 'text',
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    // Send to server
    const payload = {
      action: 'sendMessage',
      question: message,
      model_id: modelId,
      provider: provider
    };

    this.ws.send(JSON.stringify(payload));
  }

  loadHistory(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Load last 10 messages initially
    this.ws.send(JSON.stringify({ 
      action: 'load_history',
      start: 0,
      end: 10
    }));
  }

  loadMoreHistory(start: number = 0, end: number = 10): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({ 
      action: 'load_history',
      start: start,
      end: end
    }));
  }

  clearConversation(): void {
    // Stop any ongoing streaming
    this.isTypingSubject.next(false);
    this.currentStreamingMessage = '';
    this.currentStreamingId = '';
    
    // Clear local state immediately
    this.historyOffset = 0;
    this.hasMoreHistorySubject.next(false);
    this.initializeChat();
    
    // Send clear command to server without triggering response
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'clear_conversation' }));
    }
  }

  loadOlderMessages(): void {
    this.loadMoreHistory(this.historyOffset, this.historyOffset + 10);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnectedSubject.next(false);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || false;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}