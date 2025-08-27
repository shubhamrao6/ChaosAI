import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth';

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

  // Fake command responses for demonstration
  private commandResponses: { [key: string]: string } = {
    'help': `Available commands:
    help          - Show this help message
    ls            - List directory contents
    pwd           - Print working directory
    whoami        - Display current user
    nmap          - Network mapper (fake scan)
    nikto         - Web vulnerability scanner (fake)
    sqlmap        - SQL injection tool (fake)
    metasploit    - Metasploit framework (fake)
    clear         - Clear terminal
    exit          - Exit terminal`,
    
    'ls': `total 24
drwxr-xr-x 2 kali kali 4096 Dec 15 10:30 Desktop
drwxr-xr-x 2 kali kali 4096 Dec 15 10:30 Documents
drwxr-xr-x 2 kali kali 4096 Dec 15 10:30 Downloads
drwxr-xr-x 2 kali kali 4096 Dec 15 10:30 Pictures
drwxr-xr-x 2 kali kali 4096 Dec 15 10:30 tools`,
    
    'pwd': '/home/kali',
    'whoami': 'kali',
    
    'nmap -sS 192.168.1.1': `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.1.1
Host is up (0.001s latency).
Not shown: 996 closed ports
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 2.45 seconds`,

    'nikto -h http://example.com': `- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          93.184.216.34
+ Target Hostname:    example.com
+ Target Port:        80
+ Start Time:         2024-12-15 10:30:00 (GMT-5)
---------------------------------------------------------------------------
+ Server: Apache/2.4.41
+ Retrieved x-powered-by header: PHP/7.4.3
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined.
+ Uncommon header 'x-redirect-by' found, with contents: WordPress
+ /admin/: Admin login page/section found.
+ 7915 requests: 0 error(s) and 4 item(s) reported on remote host`,

    'sqlmap -u "http://example.com/page?id=1"': `        ___
       __H__
 ___ ___[)]_____ ___ ___  {1.7.2#stable}
|_ -| . [']     | .'| . |
|___|_  [.]_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[*] starting @ 10:30:15 /2024-12-15/

[10:30:15] [INFO] testing connection to the target URL
[10:30:16] [INFO] checking if the target is protected by some kind of WAF/IPS
[10:30:16] [INFO] testing if the target URL content is stable
[10:30:17] [INFO] target URL content is stable
[10:30:17] [INFO] testing if GET parameter 'id' is dynamic
[10:30:17] [INFO] GET parameter 'id' appears to be dynamic
[10:30:18] [INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable
[10:30:18] [INFO] testing for SQL injection on GET parameter 'id'
[10:30:18] [INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
[10:30:19] [INFO] GET parameter 'id' appears to be 'AND boolean-based blind - WHERE or HAVING clause' injectable
[10:30:20] [INFO] testing 'MySQL >= 5.5 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause (BIGINT UNSIGNED)'
[10:30:20] [INFO] GET parameter 'id' is 'MySQL >= 5.5 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause (BIGINT UNSIGNED)' injectable
GET parameter 'id' is vulnerable. Do you want to keep testing the others (if any)? [y/N] N
sqlmap identified the following injection point(s) with a total of 46 HTTP(s) requests:
---
Parameter: id (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: id=1 AND 1234=1234

    Type: error-based
    Title: MySQL >= 5.5 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause (BIGINT UNSIGNED)
    Payload: id=1 AND (SELECT 2*(IF((SELECT * FROM (SELECT COUNT(*),CONCAT(0x7176786271,(SELECT (ELT(2836=2836,1))),0x716a707671,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a),8446744073709551610,8446744073709551610)))
---`,

    'msfconsole': `
                                                  
      =[ metasploit v6.3.42-dev                          ]
+ -- --=[ 2357 exploits - 1220 auxiliary - 413 post       ]
+ -- --=[ 1391 payloads - 46 encoders - 11 nops          ]
+ -- --=[ 9 evasion                                       ]

Metasploit tip: Use sessions -1 to interact with the 
last opened session

msf6 > `
  };

  constructor(private authService: AuthService) {
    // Set username first
    const user = this.authService.getCurrentUser();
    this.userName = user?.firstName?.toLowerCase() || 'kali';
    
    this.initializeTerminal();
  }

  private initializeTerminal() {
    const welcomeMessage: TerminalCommand = {
      command: '',
      output: `┌──(kali㉿${this.userName})-[~]
└─$ Welcome to ChaosAI Terminal
└─$ Connected to Kali Linux penetration testing environment
└─$ Type 'help' for available commands`,
      timestamp: new Date(),
      type: 'output'
    };
    
    this.commandHistorySubject.next([welcomeMessage]);
    this.isConnected = true;
  }

  executeCommand(command: string): Observable<TerminalCommand> {
    return new Observable(observer => {
      const trimmedCommand = command.trim();
      
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

      // Simulate command execution delay
      setTimeout(() => {
        let output = '';
        let type: 'output' | 'error' = 'output';

        if (trimmedCommand === 'clear') {
          this.commandHistorySubject.next([]);
          observer.complete();
          return;
        }

        if (trimmedCommand === 'exit') {
          output = 'Connection closed.';
          this.isConnected = false;
        } else if (this.commandResponses[trimmedCommand]) {
          output = this.commandResponses[trimmedCommand];
        } else if (trimmedCommand.startsWith('cd ')) {
          const path = trimmedCommand.substring(3).trim();
          if (path === '..') {
            this.currentDirectory = '/home';
          } else if (path.startsWith('/')) {
            this.currentDirectory = path;
          } else {
            this.currentDirectory = `${this.currentDirectory}/${path}`;
          }
          output = '';
        } else if (trimmedCommand === '') {
          output = '';
        } else {
          output = `bash: ${trimmedCommand}: command not found`;
          type = 'error';
        }

        if (output) {
          const outputEntry: TerminalCommand = {
            command: '',
            output: output,
            timestamp: new Date(),
            type: type
          };

          const updatedHistory = this.commandHistorySubject.value;
          this.commandHistorySubject.next([...updatedHistory, outputEntry]);
          observer.next(outputEntry);
        }

        observer.complete();
      }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
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
}