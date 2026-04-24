import axios from "./axios";
import config from "../config";

export const storeTokenExpiry = () => {
  const now = Date.now();
  const accessTokenExpiry = now + config.accessTokenExpiry;
  const refreshTokenExpiry = now + config.refreshTokenExpiry;
  
  localStorage.setItem(config.tokenExpiryKey, JSON.stringify({
    accessToken: accessTokenExpiry,
    refreshToken: refreshTokenExpiry,
  }));
};

export const getTokenExpiry = () => {
  try {
    const expiry = localStorage.getItem(config.tokenExpiryKey);
    return expiry ? JSON.parse(expiry) : null;
  } catch {
    return null;
  }
};

export const clearTokenExpiry = () => {
  localStorage.removeItem(config.tokenExpiryKey);
};

export const fetchAndStoreUser = async () => {
  try {
    const response = await axios.get("/auth/me");
    const userData = response.data?.data?.user;

    if (userData) {
      localStorage.setItem(
        config.userStorageKey,
        JSON.stringify({
          _id: userData._id,
          role: userData.role || "shipper",
          companyName: userData.companyName,
          email: userData.email,
          ownerName: userData.ownerName,
          phone: userData.phone,
          gstNumber: userData.gstNumber,
        })
      );

      return userData;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    clearStoredUser();
    throw error; 
  }
};

export const getStoredUser = () => {
  try {
    const userData = localStorage.getItem(config.userStorageKey);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing stored user data:", error);
    return null;
  }
};

export const getStoredRole = () => {
  const user = getStoredUser();
  return user?.role ? user.role.toLowerCase() : null;
};

export const getStoredCompanyName = () => {
  const user = getStoredUser();
  return user?.companyName || null;
};

export const clearStoredUser = () => {
  localStorage.removeItem(config.userStorageKey);
  clearTokenExpiry();
};

export const isUserAuthenticated = () => {
  return !!getStoredUser();
};