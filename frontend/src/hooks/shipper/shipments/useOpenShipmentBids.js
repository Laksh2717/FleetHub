import { useQuery } from "@tanstack/react-query";
import { getOpenShipmentBids } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useOpenShipmentBids(shipmentId) {
  const { data: bids = [], isLoading, error, refetch } = useQuery({
    queryKey: ["shipmentBids", shipmentId],
    queryFn: async () => {
      const res = await getOpenShipmentBids(shipmentId);
      return res?.data?.bids || [];
    },
    enabled: !!shipmentId,
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch bids";
      toast.error(msg);
    },
  });

  return {
    bids,
    isLoading,
    error,
    refetch,
  };
}
