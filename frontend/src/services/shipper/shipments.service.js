import axios from "../../utils/axios";

export const createShipment = async (shipmentData) => {
  const response = await axios.post("/shipper/shipments", shipmentData);
  return response.data;
};

export const getUnassignedShipments = async (tab) => {
  const response = await axios.get("/shipper/shipments/unassigned", {
    params: { tab },
  });
  return response.data;
};

export const getUnassignedShipmentDetails = async (shipmentId) => {
  const response = await axios.get(
    `/shipper/shipments/unassigned/${shipmentId}`
  );
  return response.data;
};

export const getCancelledShipments = async () => {
  const response = await axios.get("/shipper/shipments/cancelled");
  return response.data;
};

export const getCancelledShipmentDetails = async (shipmentId) => {
  const response = await axios.get(
    `/shipper/shipments/cancelled/${shipmentId}`
  );
  return response.data;
};

export const getActiveShipments = async (tab) => {
  const response = await axios.get("/shipper/shipments/active", {
    params: { tab },
  });
  return response.data;
};

export const getActiveShipmentDetails = async (shipmentId) => {
  const response = await axios.get(`/shipper/shipments/active/${shipmentId}`);
  return response.data;
};

export const getPendingPaymentShipments = async () => {
  const response = await axios.get("/shipper/shipments/pending-payments");
  return response.data;
};

export const getPendingPaymentShipmentDetails = async (shipmentId) => {
  const response = await axios.get(
    `/shipper/shipments/pending-payments/${shipmentId}`
  );
  return response.data;
};

export const getShipmentHistory = async () => {
  const response = await axios.get("/shipper/shipments/history");
  return response.data;
};

export const getShipmentHistoryDetails = async (shipmentId) => {
  const response = await axios.get(
    `/shipper/shipments/history/${shipmentId}`
  );
  return response.data;
};

export const getOpenShipmentBids = async (shipmentId) => {
  const response = await axios.get(`/shipper/shipments/${shipmentId}/bids`);
  return response.data;
};

export const getOpenShipmentBidDetails = async (shipmentId, bidId) => {
  const response = await axios.get(
    `/shipper/shipments/${shipmentId}/bids/${bidId}`
  );
  return response.data;
};

export const acceptBid = async (shipmentId, bidData) => {
  const response = await axios.post(
    `/shipper/shipments/${shipmentId}/accept-bid`,
    bidData
  );
  return response.data;
};

export const rateCarrier = async (shipmentId, ratingData) => {
  const response = await axios.post(
    `/shipper/shipments/${shipmentId}/rate-carrier`,
    ratingData
  );
  return response.data;
};
export const cancelShipment = async (shipmentId, cancellationReason) => {
  const response = await axios.post(
    `/shipper/shipments/${shipmentId}/cancel`,
    { cancellationReason }
  );
  return response.data;
};
