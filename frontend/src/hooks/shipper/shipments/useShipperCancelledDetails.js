import { useQuery } from "@tanstack/react-query";
import { getCancelledShipmentDetails } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useShipperCancelledShipmentDetails(shipmentId) {
  const { data: shipment, isLoading, error } = useQuery({
    queryKey: ["cancelledShipmentDetails", shipmentId],
    queryFn: async () => {
      const res = await getCancelledShipmentDetails(shipmentId);
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
