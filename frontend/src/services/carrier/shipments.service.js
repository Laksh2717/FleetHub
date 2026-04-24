import axios from "../../utils/axios";

export const findShipments = async (page = 1, limit = 12, filters = {}) => {
  const params = { page, limit, ...filters };
  const response = await axios.get("/carrier/shipments/findShipments", {
    params,
  });
  return response.data;
};

export const findShipmentDetails = async (shipmentId) => {
  const response = await axios.get(
    `/carrier/shipments/findShipments/${shipmentId}`
  );
  return response.data;
};

export const getActiveShipments = async (tab = "assigned") => {
  const response = await axios.get(`/carrier/shipments/active?tab=${tab}`);
  return response.data;
};

export const getActiveShipmentDetails = async (shipmentId) => {
  const response = await axios.get(`/carrier/shipments/active/${shipmentId}`);
  return response.data;
};

export const getCompletedShipments = async () => {
  const response = await axios.get("/carrier/shipments/completed");
  return response.data;
};

export const getCompletedShipmentDetails = async (shipmentId) => {
  const response = await axios.get(
    `/carrier/shipments/completed/${shipmentId}`
  );
  return response.data;
};

export const getPendingPaymentShipments = async () => {
  const response = await axios.get("/carrier/shipments/pending-payments");
  return response.data;
};

export const getPendingPaymentShipmentDetails = async (shipmentId) => {
  const response = await axios.get(
    `/carrier/shipments/pending-payments/${shipmentId}`
  );
  return response.data;
};

export const markShipmentNotInterested = async (shipmentId) => {
  const response = await axios.post(
    `/carrier/shipments/${shipmentId}/not-interested`
  );
  return response.data;
};

export const confirmPickup = async (shipmentId, payload) => {
  const response = await axios.post(
    `/carrier/shipments/${shipmentId}/confirm-pickup`,
    payload
  );
  return response.data;
};

export const confirmDelivery = async (shipmentId, payload) => {
  const response = await axios.post(
    `/carrier/shipments/${shipmentId}/confirm-delivery`,
    payload
  );
  return response.data;
};