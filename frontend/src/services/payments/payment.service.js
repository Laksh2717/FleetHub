import axios from "../../utils/axios";

export const createPaymentOrder = async (shipmentId) => {
  const response = await axios.post("/payments/create-order", { shipmentId });
  return response.data.data;
};
