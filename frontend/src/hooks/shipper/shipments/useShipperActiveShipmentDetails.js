import { useQuery } from "@tanstack/react-query";
import { getActiveShipmentDetails } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useShipperActiveShipmentDetails(shipmentId, tab = "assigned") {
  const { data: shipment = null, isLoading, error } = useQuery({
    queryKey: ["activeShipmentDetails", shipmentId, tab],
    queryFn: async () => {
      const res = await getActiveShipmentDetails(shipmentId, tab);
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
