import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getOpenShipmentBidDetails } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useOpenShipmentBidDetails(shipmentId, bidId) {
  const navigate = useNavigate();

  const { data: bid = null, isLoading, error } = useQuery({
    queryKey: ["shipmentBidDetails", shipmentId, bidId],
    queryFn: async () => {
      const res = await getOpenShipmentBidDetails(shipmentId, bidId);
      return res?.data?.bid || null;
    },
    enabled: !!shipmentId && !!bidId,
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch bid details";
      toast.error(msg);
    },
  });

  return {
    bid,
    isLoading,
    error,
  };
}
