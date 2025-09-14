import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ChatModel } from '../../services/chat';
import { Subscription } from 'rxjs';

interface QuickAction {
  icon: string;
  text: string;
  action: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages') chatMessages!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  @Output() executeCommandEvent = new EventEmitter<string>();

  messages: ChatMessage[] = [];
  currentMessage = '';
  isTyping = false;
  isConnected = false;
  showAttachments = false;
  selectedModel: ChatModel;
  availableModels: ChatModel[] = [];
  hasMoreHistory = false;
  showScrollToBottom = false;
  private shouldAutoScroll = true;
  private subscriptions = new Subscription();

  quickActions: QuickAction[] = [
    { icon: '🔍', text: 'Scan Network', action: 'scan_network' },
    { icon: '🛡️', text: 'Check Vulnerabilities', action: 'check_vulns' },
    { icon: '⚡', text: 'Suggest Exploit', action: 'suggest_exploit' },
    { icon: '📊', text: 'Generate Report', action: 'generate_report' },
    { icon: '🔧', text: 'Troubleshoot', action: 'troubleshoot' }
  ];



  constructor(private chatService: ChatService) {
    this.availableModels = this.chatService.availableModels;
    this.selectedModel = this.availableModels[0]; // Default to first model
  }

  ngOnInit() {
    this.setupSubscriptions();
    console.log('Chat component initializing...');
    this.chatService.connect();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.chatService.disconnect();
  }

  private setupSubscriptions() {
    this.subscriptions.add(
      this.chatService.messages$.subscribe(messages => {
        console.log('Chat messages updated:', messages);
        this.messages = messages;
        this.autoScrollToBottom();
      })
    );

    this.subscriptions.add(
      this.chatService.isConnected$.subscribe(connected => {
        this.isConnected = connected;
      })
    );

    this.subscriptions.add(
      this.chatService.isTyping$.subscribe(typing => {
        this.isTyping = typing;
      })
    );

    this.subscriptions.add(
      this.chatService.hasMoreHistory$.subscribe(hasMore => {
        this.hasMoreHistory = hasMore;
      })
    );
  }

  onScroll() {
    if (this.chatMessages) {
      const element = this.chatMessages.nativeElement;
      const threshold = 50;
      this.shouldAutoScroll = element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
      this.showScrollToBottom = !this.shouldAutoScroll;
    }
  }



  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInput() {
    // Auto-resize textarea
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isTyping || !this.isConnected) {
      return;
    }

    const messageContent = this.currentMessage.trim();
    this.currentMessage = '';

    // Reset textarea height
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';

    // Send via chat service
    this.chatService.sendMessage(
      messageContent,
      this.selectedModel.id,
      this.selectedModel.provider
    );
  }

  sendQuickAction(action: QuickAction) {
    if (!this.isConnected || this.isTyping) {
      return;
    }

    // Send quick action as message
    this.chatService.sendMessage(
      action.text,
      this.selectedModel.id,
      this.selectedModel.provider
    );
  }

  onModelChange() {
    console.log('Selected model:', this.selectedModel);
    
    // Add system message about model change
    const modelChangeMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'system',
      content: `Switched to ${this.selectedModel.name}${this.selectedModel.tier === 'premium' ? ' (Premium)' : ''}`,
      type: 'text',
      timestamp: new Date()
    };
    
    this.messages.push(modelChangeMessage);
    this.autoScrollToBottom();
  }



  executeCommand(command: string) {
    // Emit event to parent component (dashboard) to execute command in terminal
    this.executeCommandEvent.emit(command);
  }

  copyMessage(content: string) {
    navigator.clipboard.writeText(content).then(() => {
      // Could add a toast notification here
      console.log('Message copied to clipboard');
    });
  }

  likeMessage(index: number) {
    this.messages[index].liked = !this.messages[index].liked;
  }

  clearChat() {
    this.chatService.clearConversation();
  }

  loadOlderMessages() {
    this.chatService.loadOlderMessages();
  }

  scrollToBottom() {
    if (this.chatMessages) {
      const element = this.chatMessages.nativeElement;
      element.scrollTop = element.scrollHeight;
      this.showScrollToBottom = false;
    }
  }

  toggleAttachments() {
    this.showAttachments = !this.showAttachments;
  }

  attachFile(type: string) {
    // File attachment not implemented with real API yet
    this.showAttachments = false;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  formatMessage(content: string): string {
    // Format message content with markdown formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>') // Inline code
      .replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>') // Code blocks
      .replace(/^### (.*$)/gm, '<h3 class="msg-h3">$1</h3>') // H3
      .replace(/^## (.*$)/gm, '<h2 class="msg-h2">$1</h2>') // H2
      .replace(/^# (.*$)/gm, '<h1 class="msg-h1">$1</h1>') // H1
      .replace(/^- (.*$)/gm, '<li class="msg-li">$1</li>') // List items
      .replace(/(<li[^>]*>.*<\/li>)/gs, '<ul class="msg-ul">$1</ul>') // Wrap lists
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="msg-link">$1</a>') // Links
      .replace(/(\d+\.\d+\.\d+\.\d+)/g, '<span class="msg-ip">$1</span>'); // IP addresses
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private autoScrollToBottom() {
    if (this.shouldAutoScroll) {
      setTimeout(() => {
        if (this.chatMessages) {
          const element = this.chatMessages.nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      }, 100);
    }
  }
}