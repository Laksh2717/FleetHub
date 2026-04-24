import { useQuery } from "@tanstack/react-query";
import { getActiveShipmentDetails } from "../../../services/carrier/shipments.service";
import { toast } from "react-hot-toast";

export function useCarrierActiveShipmentDetails(shipmentId) {
  const { data: shipment = null, isLoading, error } = useQuery({
    queryKey: ["carrierActiveShipmentDetails", shipmentId],
    queryFn: async () => {
      const res = await getActiveShipmentDetails(shipmentId);
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
  };
}
