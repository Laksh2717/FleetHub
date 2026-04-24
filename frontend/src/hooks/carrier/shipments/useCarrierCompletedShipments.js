import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCompletedShipments } from "../../../services/carrier/shipments.service";

export const useCarrierCompletedShipments = () => {
  const { data: shipments = [], isLoading, error, refetch } = useQuery({
    queryKey: ["carrierCompletedShipments"],
    queryFn: async () => {
      const response = await getCompletedShipments();
      return response?.data?.shipments || [];
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || "Failed to fetch shipments";
      toast.error(msg);
    },
  });

  return {
    shipments,
    isLoading,
    error,
    refetch,
  };
};
