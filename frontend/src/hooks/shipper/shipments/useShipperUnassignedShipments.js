import { useQuery } from "@tanstack/react-query";
import { getUnassignedShipments } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useShipperUnassignedShipments(activeTab = "open") {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["unassignedShipments", activeTab],
    queryFn: async () => {
      const res = await getUnassignedShipments(activeTab);
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
