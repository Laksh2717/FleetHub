import axios from "../../utils/axios";

export const getProfile = async () => {
  const response = await axios.get("/shipper/profile");
  return response.data;
};

export const getAddress = async () => {
  const response = await axios.get("/shipper/profile/address");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axios.put("/shipper/profile", profileData);
  return response.data;
};

export const deleteProfile = async () => {
  const response = await axios.delete("/shipper/profile");
  return response.data;
};