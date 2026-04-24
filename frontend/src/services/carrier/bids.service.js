import axios from "../../utils/axios";

export const placeBid = async (bidData) => {
  const response = await axios.post("/carrier/bids", bidData);
  return response.data;
};

export const getMyBids = async (tab = "active") => {
  const response = await axios.get(`/carrier/bids/my-bids?tab=${tab}`);
  return response.data;
};

export const getActiveBidDetails = async (bidId) => {
  const response = await axios.get(`/carrier/bids/my-bids/${bidId}`);
  return response.data;
};

export const deleteMyBid = async (bidId) => {
  const response = await axios.delete(`/carrier/bids/my-bids/${bidId}`);
  return response.data;
};