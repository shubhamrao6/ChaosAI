import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { TerminalComponent } from '../terminal/terminal';
import { ChatComponent } from '../chat/chat';

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
  
  // Settings
  settings: DashboardSettings = {
    terminalFontSize: 14,
    terminalTheme: 'hacker',
    aiAutoSuggest: true,
    aiVoiceMode: false
  };

  private timeInterval: any;
  private sessionStartTime: Date = new Date();
  private loadingSteps = [
    'Initializing secure connection...',
    'Loading Kali Linux environment...',
    'Starting AI assistant...',
    'Configuring penetration testing tools...',
    'Ready for operation!'
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeDashboard();
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
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
    if (this.currentTarget.trim()) {
      this.targetHost = this.currentTarget.trim();
      this.activityStatus = `Targeting ${this.targetHost}`;
      
      // Simulate target validation
      setTimeout(() => {
        this.activityStatus = 'Target set - Ready for scanning';
      }, 2000);
    }
  }

  executeCommandInTerminal(command: string) {
    // This would integrate with the terminal component
    // For now, just update activity status
    this.activityStatus = `Executing: ${command}`;
    this.commandCount++;
    
    setTimeout(() => {
      this.activityStatus = 'Command completed';
    }, 3000);
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

  restartTerminal() {
    this.activityStatus = 'Restarting terminal...';
    setTimeout(() => {
      this.activityStatus = 'Terminal restarted';
    }, 2000);
  }

  clearChat() {
    this.activityStatus = 'Chat cleared';
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