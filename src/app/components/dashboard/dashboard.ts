import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { TerminalService } from '../../services/terminal';
import { ChatService } from '../../services/chat';
import { TerminalComponent } from '../terminal/terminal';
import { ChatComponent } from '../chat/chat';
import { Subscription } from 'rxjs';

interface DashboardSettings {
  terminalFontSize: number;
  terminalTheme: string;
  aiAutoSuggest: boolean;
  aiVoiceMode: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TerminalComponent, ChatComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  sessionId = '';
  currentTarget = '';
  targetHost = '';
  isTargetSet = false;
  
  // UI State
  isLoading = true;
  loadingMessage = 'Connecting to Kali Linux...';
  loadingProgress = 0;
  isFullscreen = false;
  terminalFullscreen = false;
  chatFullscreen = false;
  showSettingsModal = false;
  
  // Status
  isActive = false;
  activityStatus = 'Idle';
  commandCount = 0;
  sessionTime = '00:00:00';
  uptime = '00:00:00';
  currentTime = '';
  
  // Connection Status
  isConnectedToKali = false;
  kaliSessionId = '';
  connectionError = '';
  
  // Settings
  settings: DashboardSettings = {
    terminalFontSize: 14,
    terminalTheme: 'hacker',
    aiAutoSuggest: true,
    aiVoiceMode: false
  };

  private timeInterval: any;
  private sessionStartTime: Date = new Date();
  private subscriptions = new Subscription();
  private loadingSteps = [
    'Initializing secure connection...',
    'Loading Kali Linux environment...',
    'Starting AI assistant...',
    'Configuring penetration testing tools...',
    'Ready for operation!'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private terminalService: TerminalService,
    private chatService: ChatService
  ) {}

  showScrollToBottom = false;
  isConnected = false;
  showUserMenu = false;

  scrollToBottom() {
    // Delegate to chat component
    const chatComponent = document.querySelector('app-chat');
    if (chatComponent) {
      (chatComponent as any).scrollToBottom();
    }
  }

  ngOnInit() {
    this.initializeDashboard();
    // Subscribe to chat connection state
    this.subscriptions.add(
      this.chatService.isConnected$.subscribe(connected => {
        this.isConnected = connected;
      })
    );
    
    // Subscribe to chat scroll state
    this.subscriptions.add(
      this.chatService.hasMoreHistory$.subscribe(() => {
        // Update scroll button visibility based on chat state
        setTimeout(() => {
          const chatMessages = document.querySelector('.chat-messages');
          if (chatMessages) {
            const element = chatMessages as HTMLElement;
            const threshold = 50;
            this.showScrollToBottom = element.scrollTop + element.clientHeight < element.scrollHeight - threshold;
          }
        }, 100);
      })
    );
    
    // Close user menu when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        this.showUserMenu = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    this.subscriptions.unsubscribe();
  }

  private initializeDashboard() {
    // Check authentication
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/auth']);
      return;
    }

    // Generate session ID
    this.sessionId = this.generateSessionId();

    // Start loading sequence
    this.simulateLoading();

    // Start time tracking
    this.startTimeTracking();

    // Load settings
    this.loadSettings();

    // Setup token refresh monitoring
    this.setupTokenRefresh();
    
    // Setup WebSocket connection monitoring
    this.setupConnectionMonitoring();
  }

  private simulateLoading() {
    let step = 0;
    const loadingInterval = setInterval(() => {
      if (step < this.loadingSteps.length) {
        this.loadingMessage = this.loadingSteps[step];
        this.loadingProgress = ((step + 1) / this.loadingSteps.length) * 100;
        step++;
      } else {
        clearInterval(loadingInterval);
        setTimeout(() => {
          this.isLoading = false;
          this.activityStatus = 'Ready';
          this.isActive = true;
        }, 500);
      }
    }, 800);
  }

  private startTimeTracking() {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
    
    // Calculate session time
    const sessionDuration = now.getTime() - this.sessionStartTime.getTime();
    this.sessionTime = this.formatDuration(sessionDuration);
    
    // Calculate uptime (fake uptime for demo)
    const uptimeDuration = sessionDuration + (Math.random() * 3600000); // Add random hours
    this.uptime = this.formatDuration(uptimeDuration);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private generateSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  setTarget() {
    if (!this.isTargetSet && this.currentTarget.trim()) {
      this.targetHost = this.currentTarget.trim();
      this.isTargetSet = true;
      this.activityStatus = `Targeting ${this.targetHost}`;
      
      // Simulate target validation
      setTimeout(() => {
        this.activityStatus = 'Target set - Ready for scanning';
      }, 2000);
    } else if (this.isTargetSet) {
      // Clear target
      this.currentTarget = '';
      this.targetHost = '';
      this.isTargetSet = false;
      this.activityStatus = 'Target cleared';
    }
  }

  executeCommandInTerminal(command: string) {
    this.activityStatus = `Executing: ${command}`;
    
    // Find terminal input and simulate typing the command
    const terminalInput = document.querySelector('.command-input') as HTMLInputElement;
    if (terminalInput) {
      // Set the command in the input
      terminalInput.value = command;
      terminalInput.dispatchEvent(new Event('input'));
      
      // Trigger Enter key press to execute
      setTimeout(() => {
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        terminalInput.dispatchEvent(enterEvent);
        terminalInput.focus();
      }, 100);
    }
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  toggleTerminalFullscreen() {
    this.terminalFullscreen = !this.terminalFullscreen;
    if (this.terminalFullscreen) {
      this.chatFullscreen = false;
    }
  }

  toggleChatFullscreen() {
    this.chatFullscreen = !this.chatFullscreen;
    if (this.chatFullscreen) {
      this.terminalFullscreen = false;
    }
  }

  reconnectWebSocket() {
    this.activityStatus = 'Reconnecting to server...';
    this.terminalService.reconnectWebSocket();
  }

  killCurrentJob() {
    this.activityStatus = 'Killing process...';
    this.terminalService.killCurrentJob();
    // Reset status after a short delay
    setTimeout(() => {
      this.activityStatus = 'Process killed';
    }, 1000);
  }

  hasRunningJob(): boolean {
    return this.terminalService.hasRunningJob();
  }

  checkJobStatus() {
    this.activityStatus = 'Checking job status...';
    this.terminalService.checkJobStatus();
  }

  clearChat() {
    this.chatService.clearConversation();
    this.activityStatus = 'Chat history cleared';
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  showSettings() {
    this.showSettingsModal = true;
  }

  closeSettings() {
    this.showSettingsModal = false;
  }

  saveSettings() {
    // Save settings to localStorage
    localStorage.setItem('chaosai_settings', JSON.stringify(this.settings));
    this.applyTheme();
    this.showSettingsModal = false;
    this.activityStatus = 'Settings saved';
  }

  applyTheme() {
    const root = document.documentElement;
    
    switch (this.settings.terminalTheme) {
      case 'matrix':
        root.style.setProperty('--accent-color', '#00ff41');
        root.style.setProperty('--terminal-text', '#00ff41');
        break;
      case 'hacker':
        root.style.setProperty('--accent-color', '#0080ff');
        root.style.setProperty('--terminal-text', '#0080ff');
        break;
      case 'classic':
        root.style.setProperty('--accent-color', '#ffffff');
        root.style.setProperty('--terminal-text', '#ffffff');
        break;
    }
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('chaosai_settings');
    if (savedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        this.applyTheme();
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }

  /**
   * Setup token refresh monitoring
   */
  private setupTokenRefresh(): void {
    // Monitor authentication state
    this.authService.currentUser$.subscribe(user => {
      if (!user && this.currentUser) {
        // User was logged out (token expired or manual logout)
        this.router.navigate(['/auth']);
      }
    });
  }

  /**
   * Manual token refresh for testing
   */
  refreshToken(): void {
    this.activityStatus = 'Refreshing session...';
    
    this.authService.refreshToken().subscribe({
      next: () => {
        this.activityStatus = 'Session refreshed';
        console.log('Token refreshed successfully');
      },
      error: (error) => {
        this.activityStatus = 'Session refresh failed';
        console.error('Token refresh failed:', error);
        // Redirect to login if refresh fails
        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 2000);
      }
    });
  }

  startResize(event: MouseEvent) {
    // Implement panel resizing functionality
    event.preventDefault();
    
    const startX = event.clientX;
    const terminalPanel = document.querySelector('.terminal-panel') as HTMLElement;
    const chatPanel = document.querySelector('.chat-panel') as HTMLElement;
    
    if (!terminalPanel || !chatPanel) return;
    
    const startTerminalWidth = terminalPanel.offsetWidth;
    const startChatWidth = chatPanel.offsetWidth;
    const totalWidth = startTerminalWidth + startChatWidth;
    
    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newTerminalWidth = startTerminalWidth + deltaX;
      const newChatWidth = totalWidth - newTerminalWidth;
      
      if (newTerminalWidth > 300 && newChatWidth > 300) {
        terminalPanel.style.flex = `0 0 ${newTerminalWidth}px`;
        chatPanel.style.flex = `0 0 ${newChatWidth}px`;
      }
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private setupConnectionMonitoring() {
    // Monitor WebSocket connection status
    this.subscriptions.add(
      this.terminalService.getConnectionStatus().subscribe(status => {
        this.isConnectedToKali = status.connected;
        this.kaliSessionId = status.sessionId || '';
        this.connectionError = status.error || '';
        
        if (status.connected) {
          this.activityStatus = 'Connected to Kali Linux';
          // Clear any previous connection errors when reconnected
          this.connectionError = '';
        } else if (status.error) {
          this.activityStatus = `Connection error: ${status.error}`;
        } else {
          this.activityStatus = 'Disconnected from Kali Linux';
        }
      })
    );
    
    // Monitor command history for count updates
    this.subscriptions.add(
      this.terminalService.commandHistory$.subscribe(history => {
        this.commandCount = history.filter(cmd => cmd.type === 'command').length;
      })
    );
  }

  logout() {
    this.activityStatus = 'Logging out...';
    
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Navigate anyway since local data is cleared
        this.router.navigate(['/']);
      }
    });
  }
}