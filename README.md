# ChaosAI - AI-Powered Penetration Testing Platform

A modern, dark-themed web application that simulates an AI-powered penetration testing environment. Built with Angular 18 and designed to look like a professional hacking platform.

## Features

### 🎯 Landing Page
- Modern dark theme with hacker aesthetics
- Animated terminal preview
- Feature showcase with penetration testing capabilities
- Statistics and call-to-action sections

### 🔐 Authentication System
- Login and signup functionality with form validation
- Demo credentials for quick access
- Fake backend simulation with localStorage
- Responsive design with terminal preview

### 🖥️ Interactive Dashboard
- **Split-panel layout**: Terminal on left, AI chat on right
- **Kali Linux Terminal Simulation**: 
  - Real-time command execution with fake responses
  - Command history and auto-completion
  - Syntax highlighting for security tools (nmap, nikto, sqlmap, etc.)
  - Terminal controls and status indicators

- **AI Assistant Chat**:
  - Intelligent conversation simulation
  - Command suggestions based on user queries
  - Quick action buttons for common tasks
  - File attachment simulation
  - Message formatting with markdown support

### 🛠️ Advanced Features
- Resizable panels with drag handles
- Fullscreen modes for terminal and chat
- Session management with time tracking
- Settings modal with customization options
- Loading animations and progress indicators
- Responsive design for mobile devices

## Technology Stack

- **Frontend**: Angular 18 (Standalone Components)
- **HTTP Client**: Angular HttpClient with interceptors
- **Authentication**: JWT tokens with automatic refresh
- **API Integration**: RESTful endpoints with error handling
- **Terminal Integration**: WebSocket connection to live Kali Linux server (`ws://40.76.252.88:8765/ws`)
- **Styling**: SCSS with CSS Custom Properties
- **Fonts**: Fira Code (monospace), Inter (sans-serif)
- **Icons**: Unicode emojis for cross-platform compatibility
- **State Management**: RxJS Observables
- **Routing**: Angular Router with lazy loading

## Installation & Setup

1. **Prerequisites**
   ```bash
   node --version  # Should be 18+ 
   npm --version   # Should be 9+
   ng --version    # Angular CLI 18+
   ```

2. **Install Dependencies**
   ```bash
   cd ChaosAI
   npm install
   ```

3. **Development Server**
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200`

4. **Build for Production**
   ```bash
   ng build --prod
   ```

## API Integration

🔗 **Backend Integration**: The application now supports real API endpoints for authentication and user management.

- **Health Check**: Monitors API availability on landing page
- **User Registration**: Real signup with validation
- **User Login**: JWT token-based authentication
- **Token Refresh**: Automatic token renewal
- **Secure Logout**: Server-side session invalidation

See [API_INTEGRATION.md](API_INTEGRATION.md) for detailed setup instructions.

## Demo Credentials

For quick testing, use these demo accounts:

- **Admin**: `admin@chaosai.com` / any password
- **Hacker**: `hacker@chaosai.com` / any password
- **Any email/password combination works for demo purposes**

**Note**: When API is unavailable, the app automatically falls back to demo mode.

## Fake Terminal Commands

The terminal simulates a Kali Linux environment with these commands:

### Basic Commands
- `help` - Show available commands
- `ls` - List directory contents  
- `pwd` - Print working directory
- `whoami` - Display current user
- `clear` - Clear terminal screen

### Penetration Testing Tools
- `nmap -sS 192.168.1.1` - TCP SYN scan
- `nikto -h http://example.com` - Web vulnerability scan
- `sqlmap -u "http://example.com/page?id=1"` - SQL injection testing
- `msfconsole` - Start Metasploit framework
- `hydra -l admin -P passwords.txt ssh://192.168.1.1` - Brute force attack
- `john --wordlist=rockyou.txt hashes.txt` - Password cracking
- `gobuster dir -u http://example.com -w wordlist.txt` - Directory enumeration

## AI Assistant Capabilities

The AI chat assistant can help with:

- **Network Scanning**: Suggests nmap commands and scanning strategies
- **Vulnerability Assessment**: Recommends security testing tools
- **Exploit Suggestions**: Provides attack vectors and exploitation techniques  
- **Report Generation**: Helps compile penetration testing reports
- **Troubleshooting**: Assists with tool configuration and issues

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── landing/          # Landing page
│   │   ├── auth/             # Login/signup
│   │   ├── dashboard/        # Main dashboard
│   │   ├── terminal/         # Terminal emulator
│   │   └── chat/             # AI chat assistant
│   ├── services/
│   │   ├── auth.ts           # Authentication service
│   │   └── terminal.ts       # Terminal command service
│   ├── app.routes.ts         # Routing configuration
│   └── app.config.ts         # App configuration
├── styles.scss               # Global styles
└── index.html               # Main HTML file
```

## Customization

### Themes
The app uses CSS custom properties for easy theming:

```scss
:root {
  --primary-bg: #0a0a0a;      // Main background
  --secondary-bg: #1a1a1a;    // Panel backgrounds  
  --accent-green: #00ff41;    // Primary accent
  --accent-red: #ff0040;      // Error/danger color
  --text-primary: #ffffff;    // Main text color
}
```

### Adding New Commands
To add new terminal commands, update the `commandResponses` object in `terminal.service.ts`:

```typescript
private commandResponses: { [key: string]: string } = {
  'your-command': 'Your command output here',
  // ... existing commands
};
```

### Extending AI Responses
Add new AI response patterns in `chat.component.ts`:

```typescript
private aiResponses: { [key: string]: string[] } = {
  'your_topic': [
    'Response option 1',
    'Response option 2'
  ],
  // ... existing responses
};
```

## Security Note

⚠️ **This is a simulation/demo application only!** 

- No real penetration testing tools are executed
- All command outputs are fake/simulated
- No actual network scanning or security testing occurs
- Intended for educational and demonstration purposes only

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## GitHub Pages Deployment

To deploy the application to GitHub Pages:

```bash
# Build with correct base href
ng build --base-href "/ChaosAI/"

# Deploy to GitHub Pages
npx angular-cli-ghpages --dir=dist/ChaosAI-frontend/browser
```

The site will be available at: `https://yourusername.github.io/ChaosAI/`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by real penetration testing tools and methodologies
- Terminal design influenced by Kali Linux and modern terminal emulators
- AI assistant concept based on modern cybersecurity automation trends