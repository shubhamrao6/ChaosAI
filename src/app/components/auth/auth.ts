import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginCredentials, SignupCredentials } from '../../services/auth';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class AuthComponent {
  isLoginMode = true;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  formData = {
    username: '',
    email: '',
    password: ''
  };

  // Terminal animation lines
  terminalLines: string[] = [
    '┌──(kali㉿kali)-[~]',
    '└─$ <span class="text-green">whoami</span>',
    'kali',
    '',
    '└─$ <span class="text-green">sudo nmap -sS -O target.com</span>',
    'Starting Nmap 7.94 ( https://nmap.org )',
    'Nmap scan report for target.com (93.184.216.34)',
    'Host is up (0.012s latency).',
    'Not shown: 998 closed ports',
    'PORT    STATE SERVICE',
    '22/tcp  open  ssh',
    '80/tcp  open  http',
    '443/tcp open  https',
    '',
    '└─$ <span class="text-green">nikto -h https://target.com</span>',
    '- Nikto v2.5.0',
    '+ Target IP:          93.184.216.34',
    '+ Target Hostname:    target.com',
    '+ Target Port:        443',
    '+ SSL Info:           Subject:  /CN=target.com',
    '+ Start Time:         2024-12-15 14:30:15',
    '',
    '└─$ <span class="text-green">sqlmap -u "https://target.com/login"</span>',
    '[INFO] testing connection to the target URL',
    '[INFO] checking if the target is protected by WAF/IPS',
    '[INFO] testing if GET parameter \'id\' is dynamic',
    '[INFO] confirming that GET parameter \'id\' is dynamic',
    '[INFO] GET parameter \'id\' appears to be injectable',
    '',
    '└─$ <span class="text-blue">Connection established. Ready for penetration testing.</span>'
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.resetForm();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  fillDemoCredentials(type: 'hacker') {
    this.formData.email = 'hacker@chaosai.com';
    this.formData.password = 'hacker123';
    this.formData.username = 'hacker';
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isLoginMode) {
      this.login();
    } else {
      this.signup();
    }
  }

  private login() {
    const credentials: LoginCredentials = {
      email: this.formData.email,
      password: this.formData.password
    };

    this.authService.login(credentials).subscribe({
      next: (user) => {
        console.log('Login successful:', user);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Login failed. Please try again.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private signup() {
    const credentials: SignupCredentials = {
      username: this.formData.username,
      email: this.formData.email,
      password: this.formData.password
    };

    this.authService.signup(credentials).subscribe({
      next: (user) => {
        console.log('Signup successful:', user);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Signup failed. Please try again.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private validateForm(): boolean {
    if (!this.formData.email || !this.formData.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return false;
    }

    if (!this.isLoginMode && !this.formData.username) {
      this.errorMessage = 'Username is required for signup.';
      return false;
    }

    if (this.formData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return false;
    }

    return true;
  }

  private resetForm() {
    this.formData = {
      username: '',
      email: '',
      password: ''
    };
  }
}