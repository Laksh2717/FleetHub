import axios from "../../utils/axios";

export const getProfile = async () => {
  const response = await axios.get("/carrier/profile");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axios.put("/carrier/profile", profileData);
  return response.data;
};

export const deleteProfile = async () => {
  const response = await axios.delete("/carrier/profile");
  return response.data;
};