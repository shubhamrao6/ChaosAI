# API Integration Guide

This document explains how the ChaosAI application integrates with the backend API endpoints.

## 🔧 Configuration

### API URL Setup
Update the API base URL in `src/app/config/api.config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-actual-api-gateway-url.com', // Replace this
  // ... rest of config
};
```

### Environment-Specific URLs
The configuration supports different environments:
- **Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.chaosai.com`
- **Production**: `https://api.chaosai.com`

## 🚀 Integrated Endpoints

### 1. Health Check (`/health`)
- **Location**: Landing page
- **Purpose**: Check API availability
- **Authentication**: None required
- **Implementation**: `LandingComponent.checkApiHealth()`

### 2. User Registration (`/auth/signup`)
- **Location**: Auth page (signup mode)
- **Purpose**: Create new user account
- **Authentication**: None required
- **Required Fields**:
  - `email`: User's email address
  - `password`: Must meet complexity requirements
  - `firstName`: User's first name
  - `lastName`: User's last name

### 3. User Login (`/auth/login`)
- **Location**: Auth page (login mode)
- **Purpose**: Authenticate user and get tokens
- **Authentication**: None required
- **Required Fields**:
  - `email`: User's email
  - `password`: User's password
- **Response**: Returns access token, refresh token, and user data

### 4. Token Refresh (`/auth/refresh`)
- **Location**: Automatic (background)
- **Purpose**: Refresh expired access tokens
- **Authentication**: Refresh token required
- **Implementation**: Automatic via `AuthInterceptor` and `AuthService`

### 5. User Logout (`/auth/logout`)
- **Location**: Dashboard
- **Purpose**: Invalidate user session
- **Authentication**: Access token required
- **Implementation**: `DashboardComponent.logout()`

## 🔐 Token Management

### Storage
Tokens are stored in localStorage:
- `chaosai_access_token`: For API authentication
- `chaosai_id_token`: User identity token
- `chaosai_refresh_token`: For token refresh
- `chaosai_user`: User profile data

### Automatic Refresh
- Tokens are automatically refreshed 5 minutes before expiry
- Failed refresh attempts redirect to login page
- HTTP 401 errors trigger automatic token refresh

### Security Features
- Automatic token cleanup on logout
- HTTP interceptor handles authentication headers
- Error handling for expired/invalid tokens

## 📁 File Structure

```
src/app/
├── config/
│   └── api.config.ts          # API configuration
├── services/
│   ├── api.ts                 # HTTP API service
│   └── auth.ts                # Authentication service
├── interceptors/
│   └── auth.interceptor.ts    # HTTP interceptor
└── components/
    ├── landing/               # Health check integration
    ├── auth/                  # Login/signup integration
    └── dashboard/             # Logout/refresh integration
```

## 🛠️ Usage Examples

### Manual Token Refresh
```typescript
// In dashboard component
refreshToken(): void {
  this.authService.refreshToken().subscribe({
    next: () => console.log('Token refreshed'),
    error: (error) => console.error('Refresh failed', error)
  });
}
```

### Check Authentication Status
```typescript
// Check if user is authenticated
const isAuthenticated = this.authService.isAuthenticated();

// Get current user
const user = this.authService.getCurrentUser();

// Get access token
const token = this.authService.getAccessToken();
```

### API Health Check
```typescript
// Check API health
this.apiService.healthCheck().subscribe({
  next: (response) => console.log('API Status:', response.status),
  error: (error) => console.log('API Offline:', error)
});
```

## 🔍 Testing

### Demo Mode
If API is unavailable, the application falls back to demo mode with:
- Fake authentication (any email/password works)
- Local storage simulation
- No real API calls

### Error Handling
- Network errors show user-friendly messages
- Invalid credentials display appropriate errors
- Token expiry is handled automatically
- API unavailability triggers demo mode

## 📝 Notes

1. **Password Requirements**: Minimum 8 characters with uppercase, lowercase, numbers, and symbols
2. **Token Expiry**: Default 1 hour, automatically refreshed
3. **Error Recovery**: Failed API calls gracefully degrade to demo mode
4. **Security**: Tokens are cleared on logout and authentication errors
5. **Compatibility**: Maintains backward compatibility with existing demo functionality

## 🚨 Important

- Replace the API URL in `api.config.ts` with your actual endpoint
- Ensure CORS is configured on your API for the frontend domain
- Test all endpoints before deploying to production
- Monitor token refresh functionality in production