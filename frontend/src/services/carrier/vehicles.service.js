import axios from "../../utils/axios";

export const getVehicles = async (tab = "all") => {
  const response = await axios.get("/carrier/vehicles", {
    params: tab && tab !== "all" ? { tab } : { tab: "all" },
  });
  return response.data;
};

export const addVehicle = async (vehicleData) => {
  const response = await axios.post("/carrier/vehicles", vehicleData);
  return response.data;
};

export const getAvailableVehiclesForBid = async (shipmentId) => {
  const response = await axios.get(
    `/carrier/vehicles/available-for-bid/${shipmentId}`
  );
  return response.data;
};

export const getVehicleDetails = async (vehicleId) => {
  const response = await axios.get(`/carrier/vehicles/${vehicleId}`);
  return response.data;
};

export const deleteVehicle = async (vehicleId) => {
  const response = await axios.delete(`/carrier/vehicles/${vehicleId}`);
  return response.data;
};

export const retireVehicle = async (vehicleId) => {
  const response = await axios.patch(`/carrier/vehicles/${vehicleId}/retire`);
  return response.data;
};