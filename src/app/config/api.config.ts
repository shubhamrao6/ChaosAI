/**
 * API Configuration
 * Update the API_BASE_URL with your actual API Gateway URL
 */

export const API_CONFIG = {
  // Replace with your actual API Gateway URL
  BASE_URL: 'https://vi62anncr8.execute-api.us-east-1.amazonaws.com/prod',
  
  // API Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    AUTH: {
      SIGNUP: '/auth/signup',
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout'
    }
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Token refresh settings
  TOKEN_REFRESH: {
    // Refresh token 5 minutes before expiry
    REFRESH_BEFORE_EXPIRY_MS: 5 * 60 * 1000,
    // Default token expiry (1 hour)
    DEFAULT_EXPIRY_MS: 60 * 60 * 1000
  }
};

/**
 * Environment-specific configuration
 * You can extend this for different environments (dev, staging, prod)
 */
export const getApiConfig = () => {
  return API_CONFIG;
};