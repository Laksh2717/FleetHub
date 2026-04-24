import { useQuery } from "@tanstack/react-query";
import { getShipmentHistory } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useShipperShipmentHistory() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["shipmentHistory"],
    queryFn: async () => {
      const res = await getShipmentHistory();
      return res?.data?.shipments || [];
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || "Failed to fetch shipments";
      toast.error(msg);
    },
  });

  const shipments = data || [];

  return {
    shipments,
    isLoading,
    error,
    refetch,
  };
}
