import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Stat {
  number: string;
  label: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingComponent implements OnInit {
  
  // API Status
  apiStatus: 'checking' | 'healthy' | 'error' = 'checking';
  apiMessage = 'Checking system status...';
  
  // Terminal animation lines
  terminalLines: string[] = [
    '┌──(kali㉿kali)-[~]',
    '└─$ <span class="text-green">nmap -sS 192.168.1.0/24</span>',
    'Starting Nmap 7.94 scan...',
    'Host discovery completed (12 hosts up)',
    '',
    '└─$ <span class="text-green">sqlmap -u "http://target.com/login"</span>',
    'Testing for SQL injection vulnerabilities...',
    '[INFO] Parameter \'username\' appears to be injectable',
    '',
    '└─$ <span class="text-green">msfconsole</span>',
    'Metasploit Framework v6.3.42',
    'msf6 > <span class="text-blue">use exploit/multi/handler</span>',
    'msf6 exploit(multi/handler) > <span class="text-blue">set payload windows/meterpreter/reverse_tcp</span>',
    'payload => windows/meterpreter/reverse_tcp'
  ];

  // Features data
  features: Feature[] = [
    {
      icon: '🤖',
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms analyze vulnerabilities and suggest optimal attack vectors automatically.'
    },
    {
      icon: '🔍',
      title: 'Automated Reconnaissance',
      description: 'Intelligent scanning and enumeration with real-time threat assessment and vulnerability prioritization.'
    },
    {
      icon: '⚡',
      title: 'Real-time Exploitation',
      description: 'Execute sophisticated attacks with AI guidance and automated payload generation for maximum efficiency.'
    },
    {
      icon: '📊',
      title: 'Smart Reporting',
      description: 'Generate comprehensive penetration testing reports with AI-driven insights and remediation recommendations.'
    },
    {
      icon: '🛡️',
      title: 'Evasion Techniques',
      description: 'Advanced anti-detection methods powered by AI to bypass modern security solutions and firewalls.'
    },
    {
      icon: '🔗',
      title: 'Chain Exploitation',
      description: 'Automatically discover and chain multiple vulnerabilities for complex attack scenarios and privilege escalation.'
    }
  ];

  // Statistics data
  stats: Stat[] = [
    { number: '500+', label: 'Exploit Modules' },
    { number: '1000+', label: 'Vulnerability Checks' },
    { number: '50+', label: 'Evasion Techniques' },
    { number: '24/7', label: 'AI Assistance' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Start terminal animation
    this.animateTerminal();
    
    // Check API health
    this.checkApiHealth();
  }

  private animateTerminal() {
    // Terminal lines are animated via CSS animation-delay
    // This method can be extended for more complex animations
  }

  /**
   * Check API health status
   */
  private checkApiHealth(): void {
    this.apiService.healthCheck().subscribe({
      next: (response) => {
        this.apiStatus = 'healthy';
        this.apiMessage = `System operational - ${response.service}`;
        console.log('API Health Check:', response);
      },
      error: (error) => {
        this.apiStatus = 'error';
        this.apiMessage = 'System offline - Demo mode active';
        console.warn('API Health Check failed:', error);
      }
    });
  }

  scrollToFeatures() {
    const featuresElement = document.getElementById('features');
    if (featuresElement) {
      featuresElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}