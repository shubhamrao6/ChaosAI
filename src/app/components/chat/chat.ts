import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  type: 'text' | 'command' | 'analysis';
  timestamp: Date;
  liked?: boolean;
}

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
export class ChatComponent implements OnInit {
  @ViewChild('chatMessages') chatMessages!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  @Output() executeCommandEvent = new EventEmitter<string>();

  messages: ChatMessage[] = [];
  currentMessage = '';
  isTyping = false;
  isOnline = true;
  showAttachments = false;
  selectedModel = 'gpt-4';
  private shouldAutoScroll = true;

  quickActions: QuickAction[] = [
    { icon: '🔍', text: 'Scan Network', action: 'scan_network' },
    { icon: '🛡️', text: 'Check Vulnerabilities', action: 'check_vulns' },
    { icon: '⚡', text: 'Suggest Exploit', action: 'suggest_exploit' },
    { icon: '📊', text: 'Generate Report', action: 'generate_report' },
    { icon: '🔧', text: 'Troubleshoot', action: 'troubleshoot' }
  ];

  // Fake AI responses for demonstration
  private aiResponses: { [key: string]: string[] } = {
    'scan_network': [
      'I recommend starting with a network discovery scan. Let me suggest some commands:',
      'For a comprehensive network scan, try these approaches:'
    ],
    'check_vulns': [
      'Let\'s identify potential vulnerabilities in your target. Here are some effective methods:',
      'I\'ll help you perform vulnerability assessment using these tools:'
    ],
    'suggest_exploit': [
      'Based on the scan results, here are some potential exploitation techniques:',
      'I found some interesting attack vectors. Let me suggest some exploits:'
    ],
    'generate_report': [
      'I\'ll help you create a comprehensive penetration testing report.',
      'Let me compile the findings into a professional report format.'
    ],
    'troubleshoot': [
      'I\'m here to help troubleshoot any issues you\'re experiencing.',
      'Let\'s diagnose the problem step by step.'
    ],
    'default': [
      'I understand you\'re asking about penetration testing. Let me help you with that.',
      'That\'s an interesting question about cybersecurity. Here\'s what I recommend:',
      'Based on my analysis, I suggest the following approach:',
      'Let me provide you with some guidance on this security topic:'
    ]
  };

  private commandSuggestions: { [key: string]: string[] } = {
    'scan_network': [
      'nmap -sn 192.168.1.0/24',
      'nmap -sS -sV -O 192.168.1.1',
      'masscan -p1-65535 192.168.1.0/24 --rate=1000'
    ],
    'check_vulns': [
      'nmap --script vuln 192.168.1.1',
      'nikto -h http://192.168.1.1',
      'openvas-cli -T csv -o scan_results.csv'
    ],
    'suggest_exploit': [
      'msfconsole',
      'searchsploit apache 2.4',
      'use exploit/multi/handler'
    ]
  };

  constructor() {}

  ngOnInit() {
    this.initializeChat();
  }

  onScroll() {
    if (this.chatMessages) {
      const element = this.chatMessages.nativeElement;
      const threshold = 50;
      this.shouldAutoScroll = element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
    }
  }

  private initializeChat() {
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'ai',
      content: 'Welcome to ChaosAI! I\'m your AI-powered penetration testing assistant. I can help you with:\n\n• Network reconnaissance and scanning\n• Vulnerability assessment\n• Exploit suggestions\n• Security analysis\n• Command recommendations\n\nHow can I assist you with your penetration testing today?',
      type: 'text',
      timestamp: new Date()
    };

    this.messages = [welcomeMessage];
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
    if (!this.currentMessage.trim() || this.isTyping) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'user',
      content: this.currentMessage.trim(),
      type: 'text',
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.scrollToBottom();
    const messageContent = this.currentMessage.trim();
    this.currentMessage = '';

    // Reset textarea height
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';

    // Simulate AI response
    this.simulateAIResponse(messageContent);
  }

  sendQuickAction(action: QuickAction) {
    // Add user message for quick action
    const userMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'user',
      content: action.text,
      type: 'text',
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.scrollToBottom();
    this.simulateAIResponse(action.action);
  }

  private simulateAIResponse(input: string) {
    this.isTyping = true;

    setTimeout(() => {
      // Determine response type based on input
      let responseKey = 'default';
      let responseType: 'text' | 'command' | 'analysis' = 'text';

      if (input.includes('scan') || input === 'scan_network') {
        responseKey = 'scan_network';
      } else if (input.includes('vuln') || input === 'check_vulns') {
        responseKey = 'check_vulns';
      } else if (input.includes('exploit') || input === 'suggest_exploit') {
        responseKey = 'suggest_exploit';
      } else if (input.includes('report') || input === 'generate_report') {
        responseKey = 'generate_report';
      } else if (input.includes('help') || input.includes('troubleshoot') || input === 'troubleshoot') {
        responseKey = 'troubleshoot';
      }

      // Get random response
      const responses = this.aiResponses[responseKey] || this.aiResponses['default'];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      // Add AI response
      const aiMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'ai',
        content: randomResponse,
        type: responseType,
        timestamp: new Date()
      };

      this.messages.push(aiMessage);
      this.scrollToBottom();

      // Add command suggestion if applicable
      if (this.commandSuggestions[responseKey]) {
        setTimeout(() => {
          const commands = this.commandSuggestions[responseKey];
          const randomCommand = commands[Math.floor(Math.random() * commands.length)];

          const commandMessage: ChatMessage = {
            id: this.generateId(),
            sender: 'ai',
            content: randomCommand,
            type: 'command',
            timestamp: new Date()
          };

          this.messages.push(commandMessage);
          this.scrollToBottom();
          this.isTyping = false;
        }, 1000);
      } else {
        this.isTyping = false;
      }
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
  }

  executeCommand(command: string) {
    // Emit event to parent component (dashboard) to execute command in terminal
    this.executeCommandEvent.emit(command);

    // Add system message
    const systemMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'system',
      content: `Executing command: ${command}`,
      type: 'text',
      timestamp: new Date()
    };

    this.messages.push(systemMessage);
    this.scrollToBottom();
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
    this.messages = [];
    this.initializeChat();
  }

  toggleAttachments() {
    this.showAttachments = !this.showAttachments;
  }

  attachFile(type: string) {
    // Simulate file attachment
    const systemMessage: ChatMessage = {
      id: this.generateId(),
      sender: 'system',
      content: `${type} file attached successfully`,
      type: 'text',
      timestamp: new Date()
    };

    this.messages.push(systemMessage);
    this.scrollToBottom();
    this.showAttachments = false;

    // Simulate AI analysis of attached file
    setTimeout(() => {
      const analysisMessage: ChatMessage = {
        id: this.generateId(),
        sender: 'ai',
        content: `I've analyzed your ${type} file. Here are the key findings:\n\n• Multiple potential vulnerabilities detected\n• Recommended immediate actions identified\n• Detailed analysis available in the report section`,
        type: 'analysis',
        timestamp: new Date()
      };

      this.messages.push(analysisMessage);
      this.scrollToBottom();
    }, 2000);
  }

  formatMessage(content: string): string {
    // Format message content with basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue">$1</a>') // Links
      .replace(/(\d+\.\d+\.\d+\.\d+)/g, '<span class="text-green">$1</span>'); // IP addresses
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private scrollToBottom() {
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