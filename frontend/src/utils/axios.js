import axios from "axios";
import config from "../config";

const instance = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
});

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];
let lastRefreshTime = 0;

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

/**
 * Update token expiry in localStorage after successful refresh
 */
const updateTokenExpiry = () => {
  const now = Date.now();
  const expiry = {
    accessToken: now + config.accessTokenExpiry,
    refreshToken: now + config.refreshTokenExpiry,
  };
  localStorage.setItem(config.tokenExpiryKey, JSON.stringify(expiry));
};

/**
 * Clear all auth data and redirect to login
 */
const handleSessionExpired = () => {
  localStorage.removeItem(config.userStorageKey);
  localStorage.removeItem(config.tokenExpiryKey);
  
  // Prevent multiple alerts and redirects
  if (!window.location.pathname.includes('/login')) {
    alert("Session expired. Please login again.");
    window.location.href = "/login";
  }
};

/**
 * RESPONSE INTERCEPTOR
 * Handles token refresh ONLY when backend returns 401
 * This is the ONLY place where token refresh should happen
 */
instance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Don't retry auth endpoints
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh-token");

    // Handle 401 errors (expired access token)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const now = Date.now();
      if (now - lastRefreshTime < 10000) {
        console.log("⏭ Skipping refresh — already refreshed recently");
        return instance(originalRequest);
      }

      // Queue requests if refresh already in progress
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => instance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Try to refresh the token
        await instance.post("/auth/refresh-token");
        lastRefreshTime = Date.now();
        
        // Update localStorage expiry after successful refresh
        updateTokenExpiry();

        console.log("✅ Token refreshed successfully");

        if (window.__reconnectSSE) {
          window.__reconnectSSE();
        }
        // Process queued requests
        processQueue(null);

        // Retry the original request
        return instance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        
        // Refresh token is invalid or expired
        processQueue(refreshError);
        handleSessionExpired();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;