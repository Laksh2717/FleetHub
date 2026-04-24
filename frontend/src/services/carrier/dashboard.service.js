import axios from "../../utils/axios";

export const getDashboard = async () => {
  const response = await axios.get("/carrier/dashboard");
  return response.data;
};

export const getShipmentStatusChart = async (range = 14) => {
  const response = await axios.get("/carrier/dashboard/shipment-status-chart", {
    params: { timeWindowDays: range },
  });
  return response.data;
};

export const getEarningsTrendChart = async (year) => {
  const response = await axios.get("/carrier/dashboard/earnings-trend", {
    params: { year },
  });
  return response.data;
};