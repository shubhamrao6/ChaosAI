# ChaosAI Backend API Endpoints

## Authentication Endpoints

### 1. User Registration
**POST** `/api/auth/register`

**Request:**
```json
{
  "username": "hacker123",
  "email": "hacker@chaosai.com",
  "password": "securePassword123"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "usr_12345",
      "username": "hacker123",
      "email": "hacker@chaosai.com",
      "createdAt": "2024-12-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. User Login
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "hacker@chaosai.com",
  "password": "securePassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "usr_12345",
      "username": "hacker123",
      "email": "hacker@chaosai.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "sessionId": "sess_abc123"
  }
}
```

### 3. Token Refresh
**POST** `/api/auth/refresh`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-12-15T12:30:00Z"
  }
}
```

### 4. Logout
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Terminal/Command Execution Endpoints

### 5. Execute Command
**POST** `/api/terminal/execute`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "command": "nmap -sS 192.168.1.1",
  "sessionId": "sess_abc123",
  "targetHost": "192.168.1.1"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "commandId": "cmd_xyz789",
    "command": "nmap -sS 192.168.1.1",
    "output": "Starting Nmap 7.94 ( https://nmap.org )\nNmap scan report for 192.168.1.1\nHost is up (0.012s latency).\n...",
    "exitCode": 0,
    "executionTime": 2.5,
    "timestamp": "2024-12-15T10:35:00Z"
  }
}
```

### 6. Get Command History
**GET** `/api/terminal/history?sessionId=sess_abc123&limit=50&offset=0`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "commands": [
      {
        "id": "cmd_xyz789",
        "command": "nmap -sS 192.168.1.1",
        "output": "Starting Nmap 7.94...",
        "exitCode": 0,
        "timestamp": "2024-12-15T10:35:00Z"
      }
    ],
    "total": 25,
    "hasMore": false
  }
}
```

### 7. Stream Command Output (WebSocket)
**WS** `/api/terminal/stream`

**Connection Parameters:**
```
?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&sessionId=sess_abc123
```

**Message Format:**
```json
{
  "type": "output",
  "data": {
    "commandId": "cmd_xyz789",
    "chunk": "Host is up (0.012s latency).\n",
    "timestamp": "2024-12-15T10:35:02Z"
  }
}
```

## AI Chat Endpoints

### 8. Send Chat Message
**POST** `/api/chat/message`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "message": "How can I scan for open ports on 192.168.1.1?",
  "sessionId": "sess_abc123",
  "model": "gpt-4",
  "context": {
    "targetHost": "192.168.1.1",
    "lastCommands": ["whoami", "pwd"]
  }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_def456",
    "response": "To scan for open ports on 192.168.1.1, you can use nmap. Here's a recommended command:",
    "suggestedCommands": [
      "nmap -sS 192.168.1.1",
      "nmap -sV -p- 192.168.1.1"
    ],
    "timestamp": "2024-12-15T10:36:00Z"
  }
}
```

### 9. Get Chat History
**GET** `/api/chat/history?sessionId=sess_abc123&limit=20&offset=0`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_def456",
        "type": "user",
        "content": "How can I scan for open ports on 192.168.1.1?",
        "timestamp": "2024-12-15T10:35:30Z"
      },
      {
        "id": "msg_ghi789",
        "type": "ai",
        "content": "To scan for open ports on 192.168.1.1, you can use nmap...",
        "suggestedCommands": ["nmap -sS 192.168.1.1"],
        "timestamp": "2024-12-15T10:36:00Z"
      }
    ],
    "total": 12,
    "hasMore": false
  }
}
```

### 10. Clear Chat History
**DELETE** `/api/chat/history?sessionId=sess_abc123`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Chat history cleared successfully"
}
```

## Session Management Endpoints

### 11. Create Session
**POST** `/api/sessions`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "name": "Penetration Test - Company XYZ",
  "targetHost": "192.168.1.1",
  "description": "Security assessment for internal network"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "name": "Penetration Test - Company XYZ",
    "targetHost": "192.168.1.1",
    "status": "active",
    "createdAt": "2024-12-15T10:30:00Z",
    "uptime": "00:00:00"
  }
}
```

### 12. Get Session Details
**GET** `/api/sessions/sess_abc123`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "name": "Penetration Test - Company XYZ",
    "targetHost": "192.168.1.1",
    "status": "active",
    "createdAt": "2024-12-15T10:30:00Z",
    "uptime": "01:25:30",
    "commandCount": 15,
    "lastActivity": "2024-12-15T11:55:00Z",
    "statistics": {
      "totalCommands": 15,
      "successfulCommands": 13,
      "failedCommands": 2,
      "averageExecutionTime": 1.8
    }
  }
}
```

### 13. Update Session Target
**PATCH** `/api/sessions/sess_abc123`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "targetHost": "192.168.1.100",
  "name": "Updated Test Session"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "targetHost": "192.168.1.100",
    "name": "Updated Test Session",
    "updatedAt": "2024-12-15T11:56:00Z"
  }
}
```

### 14. List User Sessions
**GET** `/api/sessions?status=active&limit=10&offset=0`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "sess_abc123",
        "name": "Penetration Test - Company XYZ",
        "targetHost": "192.168.1.1",
        "status": "active",
        "createdAt": "2024-12-15T10:30:00Z",
        "lastActivity": "2024-12-15T11:55:00Z"
      }
    ],
    "total": 5,
    "hasMore": false
  }
}
```

## File Management Endpoints

### 15. Upload File/Attachment
**POST** `/api/files/upload`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Request:**
```
Form Data:
- file: [binary file data]
- sessionId: sess_abc123
- type: scan_result | log_file | screenshot
- description: "Nmap scan results for target network"
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "fileId": "file_jkl012",
    "filename": "nmap_scan_results.txt",
    "size": 2048,
    "type": "scan_result",
    "uploadedAt": "2024-12-15T12:00:00Z",
    "url": "/api/files/file_jkl012/download"
  }
}
```

### 16. Download File
**GET** `/api/files/file_jkl012/download`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="nmap_scan_results.txt"

[Binary file content]
```

## User Profile Endpoints

### 17. Get User Profile
**GET** `/api/user/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_12345",
    "username": "hacker123",
    "email": "hacker@chaosai.com",
    "createdAt": "2024-12-10T08:00:00Z",
    "lastLogin": "2024-12-15T10:30:00Z",
    "preferences": {
      "terminalTheme": "hacker",
      "terminalFontSize": 14,
      "aiAutoSuggest": true,
      "aiVoiceMode": false
    },
    "statistics": {
      "totalSessions": 25,
      "totalCommands": 450,
      "totalUptime": "48:30:15"
    }
  }
}
```

### 18. Update User Preferences
**PATCH** `/api/user/preferences`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "terminalTheme": "matrix",
  "terminalFontSize": 16,
  "aiAutoSuggest": false
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "terminalTheme": "matrix",
      "terminalFontSize": 16,
      "aiAutoSuggest": false,
      "aiVoiceMode": false
    },
    "updatedAt": "2024-12-15T12:05:00Z"
  }
}
```

## System Status Endpoints

### 19. Get System Status
**GET** `/api/system/status`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "version": "1.0.0",
    "uptime": "72:15:30",
    "services": {
      "terminal": "healthy",
      "ai": "healthy",
      "database": "healthy"
    },
    "statistics": {
      "activeUsers": 45,
      "activeSessions": 23,
      "totalCommands": 1250
    }
  }
}
```

## Error Response Format

All endpoints follow a consistent error response format:

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": "The provided credentials do not match any user account"
  },
  "timestamp": "2024-12-15T10:30:00Z"
}
```

## Common HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **409** - Conflict
- **422** - Unprocessable Entity
- **429** - Too Many Requests
- **500** - Internal Server Error
- **503** - Service Unavailable

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire after 24 hours and can be refreshed using the `/api/auth/refresh` endpoint.