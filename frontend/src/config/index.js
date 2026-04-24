export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  
  accessTokenExpiry: Number(import.meta.env.VITE_ACCESS_TOKEN_EXPIRY) || 15 * 60 * 1000, // 15 minutes
  refreshTokenExpiry: Number(import.meta.env.VITE_REFRESH_TOKEN_EXPIRY) || 15 * 24 * 60 * 60 * 1000, // 15 days
  
  // Storage Keys
  userStorageKey: import.meta.env.VITE_USER_STORAGE_KEY || 'fleetHub_user',
  tokenExpiryKey: import.meta.env.VITE_TOKEN_EXPIRY_KEY || 'fleetHub_tokenExpiry',
};

export default config;  