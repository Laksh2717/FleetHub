import { useQuery } from "@tanstack/react-query";
import { getUnassignedShipmentDetails } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useShipperUnassignedShipmentDetails(shipmentId) {
  const { data: shipment, isLoading, error } = useQuery({
    queryKey: ["unassignedShipmentDetails", shipmentId],
    queryFn: async () => {
      const res = await getUnassignedShipmentDetails(shipmentId);
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
