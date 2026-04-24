import axios from "../../utils/axios";

export const getDashboard = async () => {
  const response = await axios.get("/shipper/dashboard");
  return response.data;
};

export const getShipmentCostTrendChart = async (year) => {
  const response = await axios.get("/shipper/dashboard/shipment-cost-trend", {
    params: { year },
  });
  return response.data;
};

export const getShipmentStatusChart = async (range = 14) => {
  const response = await axios.get("/shipper/dashboard/shipment-status-chart", {
    params: { timeWindowDays: range },
  });
  return response.data;
};