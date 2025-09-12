import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TerminalService, TerminalCommand } from '../../services/terminal';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs';

interface CommandSuggestion {
  command: string;
  description: string;
}

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss'
})
export class TerminalComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('terminalBody') terminalBody!: ElementRef;
  @ViewChild('commandInput') commandInput!: ElementRef;

  commandHistory: TerminalCommand[] = [];
  currentCommand = '';
  lastCommand = '';
  isExecuting = false;
  isConnected = true;
  isFullscreen = false;
  isTyping = false;
  
  // Command suggestions
  showSuggestions = false;
  suggestions: CommandSuggestion[] = [];
  selectedSuggestionIndex = 0;
  
  // Status
  commandCount = 0;
  currentTime = '';
  currentDirectory = '~';
  userName = 'kali';
  
  private subscription: Subscription = new Subscription();
  private timeInterval: any;
  private typingTimeout: any;
  private commandHistoryIndex = -1;
  private commandHistoryCache: string[] = [];

  // Available commands with descriptions
  private availableCommands: CommandSuggestion[] = [
    { command: 'help', description: 'Show available commands' },
    { command: 'ls', description: 'List directory contents' },
    { command: 'pwd', description: 'Print working directory' },
    { command: 'whoami', description: 'Display current user' },
    { command: 'clear', description: 'Clear terminal screen' },
    { command: 'nmap -sS 192.168.1.1', description: 'TCP SYN scan of target' },
    { command: 'nmap -sU 192.168.1.1', description: 'UDP scan of target' },
    { command: 'nikto -h http://example.com', description: 'Web vulnerability scan' },
    { command: 'sqlmap -u "http://example.com/page?id=1"', description: 'SQL injection testing' },
    { command: 'msfconsole', description: 'Start Metasploit framework' },
    { command: 'hydra -l admin -P passwords.txt ssh://192.168.1.1', description: 'Brute force SSH login' },
    { command: 'john --wordlist=rockyou.txt hashes.txt', description: 'Password cracking with John' },
    { command: 'aircrack-ng -w wordlist.txt capture.cap', description: 'WiFi password cracking' },
    { command: 'gobuster dir -u http://example.com -w /usr/share/wordlists/dirb/common.txt', description: 'Directory enumeration' },
    { command: 'enum4linux 192.168.1.1', description: 'SMB enumeration' },
    { command: 'searchsploit apache 2.4', description: 'Search for exploits' }
  ];

  constructor(
    private terminalService: TerminalService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Set username from logged-in user
    const user = this.authService.getCurrentUser();
    this.userName = user?.firstName?.toLowerCase() || 'kali';
    
    this.initializeTerminal();
    this.startClock();
    this.focusInput();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private initializeTerminal() {
    // Subscribe to command history
    this.subscription.add(
      this.terminalService.commandHistory$.subscribe(history => {
        this.commandHistory = history;
        this.commandCount = history.filter(cmd => cmd.type === 'command').length;
      })
    );

    // Get current directory
    this.currentDirectory = this.terminalService.getCurrentDirectory();
    this.isConnected = this.terminalService.isTerminalConnected();
  }

  private startClock() {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (this.showSuggestions && this.suggestions.length > 0) {
          this.selectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
        } else if (!this.isExecuting) {
          this.executeCommand();
        }
        break;
        
      case 'Tab':
        event.preventDefault();
        this.handleTabCompletion();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (this.showSuggestions) {
          this.navigateSuggestions('up');
        } else {
          this.navigateHistory('up');
        }
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        if (this.showSuggestions) {
          this.navigateSuggestions('down');
        } else {
          this.navigateHistory('down');
        }
        break;
        
      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(event.key)) {
      return;
    }
    
    this.isTyping = true;
    this.updateSuggestions();
    
    // Clear typing indicator after delay
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
    }, 500);
  }

  private executeCommand() {
    if (!this.currentCommand.trim() || this.isExecuting) {
      console.log('Command blocked - empty or already executing');
      return;
    }

    console.log('Terminal component executing command:', this.currentCommand);
    this.lastCommand = this.currentCommand;
    this.isExecuting = true;
    this.hideSuggestions();
    
    // Add to command history cache
    this.commandHistoryCache.push(this.currentCommand);
    this.commandHistoryIndex = this.commandHistoryCache.length;

    this.subscription.add(
      this.terminalService.executeCommand(this.currentCommand).subscribe({
        next: (result) => {
          console.log('Command execution result:', result);
        },
        error: (error) => {
          console.error('Command execution error:', error);
          this.isExecuting = false;
        },
        complete: () => {
          console.log('Command execution completed');
          this.isExecuting = false;
          this.currentCommand = '';
          this.currentDirectory = this.terminalService.getCurrentDirectory();
          this.focusInput();
        }
      })
    );
  }

  private handleTabCompletion() {
    if (!this.currentCommand.trim()) {
      return;
    }

    const matches = this.availableCommands.filter(cmd => 
      cmd.command.toLowerCase().startsWith(this.currentCommand.toLowerCase())
    );

    if (matches.length === 1) {
      this.currentCommand = matches[0].command;
      this.hideSuggestions();
    } else if (matches.length > 1) {
      this.suggestions = matches;
      this.showSuggestions = true;
      this.selectedSuggestionIndex = 0;
    }
  }

  private navigateHistory(direction: 'up' | 'down') {
    if (this.commandHistoryCache.length === 0) {
      return;
    }

    if (direction === 'up') {
      if (this.commandHistoryIndex > 0) {
        this.commandHistoryIndex--;
        this.currentCommand = this.commandHistoryCache[this.commandHistoryIndex];
      }
    } else {
      if (this.commandHistoryIndex < this.commandHistoryCache.length - 1) {
        this.commandHistoryIndex++;
        this.currentCommand = this.commandHistoryCache[this.commandHistoryIndex];
      } else {
        this.commandHistoryIndex = this.commandHistoryCache.length;
        this.currentCommand = '';
      }
    }
  }

  private navigateSuggestions(direction: 'up' | 'down') {
    if (!this.showSuggestions || this.suggestions.length === 0) {
      return;
    }

    if (direction === 'up') {
      this.selectedSuggestionIndex = this.selectedSuggestionIndex > 0 
        ? this.selectedSuggestionIndex - 1 
        : this.suggestions.length - 1;
    } else {
      this.selectedSuggestionIndex = this.selectedSuggestionIndex < this.suggestions.length - 1 
        ? this.selectedSuggestionIndex + 1 
        : 0;
    }
  }

  private updateSuggestions() {
    if (!this.currentCommand.trim()) {
      this.hideSuggestions();
      return;
    }

    const matches = this.availableCommands.filter(cmd => 
      cmd.command.toLowerCase().includes(this.currentCommand.toLowerCase())
    );

    if (matches.length > 0) {
      this.suggestions = matches.slice(0, 8); // Limit to 8 suggestions
      this.showSuggestions = true;
      this.selectedSuggestionIndex = 0;
    } else {
      this.hideSuggestions();
    }
  }

  selectSuggestion(suggestion: CommandSuggestion) {
    this.currentCommand = suggestion.command;
    this.hideSuggestions();
    this.focusInput();
  }

  private hideSuggestions() {
    this.showSuggestions = false;
    this.suggestions = [];
    this.selectedSuggestionIndex = 0;
  }

  clearTerminal() {
    this.terminalService.clearHistory();
    this.focusInput();
  }

  killCurrentJob() {
    this.terminalService.killCurrentJob();
  }

  hasRunningJob(): boolean {
    return this.terminalService.hasRunningJob();
  }

  reconnectWebSocket() {
    this.terminalService.reconnectWebSocket();
  }

  formatOutput(output: string): string {
    // Add syntax highlighting for common patterns
    return output
      .replace(/(\d+\.\d+\.\d+\.\d+)/g, '<span class="text-blue">$1</span>') // IP addresses
      .replace(/(https?:\/\/[^\s]+)/g, '<span class="text-cyan">$1</span>') // URLs
      .replace(/(\d+\/tcp|\d+\/udp)/g, '<span class="text-green">$1</span>') // Ports
      .replace(/(open|closed|filtered)/g, '<span class="text-yellow">$1</span>') // Port states
      .replace(/(ERROR|FAILED|CRITICAL)/gi, '<span class="text-red">$1</span>') // Errors
      .replace(/(SUCCESS|COMPLETED|OK)/gi, '<span class="text-green">$1</span>'); // Success
  }

  private focusInput() {
    setTimeout(() => {
      if (this.commandInput) {
        this.commandInput.nativeElement.focus();
      }
    }, 100);
  }

  private scrollToBottom() {
    if (this.terminalBody) {
      const element = this.terminalBody.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}