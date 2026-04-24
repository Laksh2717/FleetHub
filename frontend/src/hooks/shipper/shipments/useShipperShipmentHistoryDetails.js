import { useQuery } from "@tanstack/react-query";
import { getShipmentHistoryDetails } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useShipperShipmentHistoryDetails(shipmentId) {
  const { data: shipment, isLoading, error, refetch } = useQuery({
    queryKey: ["shipmentHistoryDetails", shipmentId],
    queryFn: async () => {
      const res = await getShipmentHistoryDetails(shipmentId);
      return res?.data?.shipment || null;
    },
    enabled: !!shipmentId,
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch shipment details";
      toast.error(msg);
    },
  });

  return {
    shipment,
    isLoading,
    error,
    refetch,
  };
}
