import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCompletedShipmentDetails } from "../../../services/carrier/shipments.service";

export const useCarrierCompletedShipmentDetails = (shipmentId) => {
  const { data: shipment = null, isLoading, error, refetch } = useQuery({
    queryKey: ["carrierCompletedShipmentDetails", shipmentId],
    queryFn: async () => {
      const res = await getCompletedShipmentDetails(shipmentId);
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
};
