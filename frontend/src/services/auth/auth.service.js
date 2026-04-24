import axios from "../../utils/axios";
import { storeTokenExpiry, clearTokenExpiry } from "../../utils/authUtils";

export const registerUser = async (userData) => {
  const response = await axios.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await axios.post("/auth/login", credentials);
  
  if (response.data?.success) {
    storeTokenExpiry();
  }
  
  return response.data;
};

export const logoutUser = async () => {
  try {
    const response = await axios.post("/auth/logout");
    return response.data;
  } finally {
    clearTokenExpiry();
  }
};

export const getCurrentUser = async () => {
  const response = await axios.get("/auth/me");
  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await axios.post("/auth/refresh-token");
  
  if (response.data?.success) {
    storeTokenExpiry();
  }
  
  return response.data;
};