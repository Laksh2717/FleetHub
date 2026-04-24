import { useQuery } from "@tanstack/react-query";
import { getActiveShipments } from "../../../services/carrier/shipments.service";
import { toast } from "react-hot-toast";

export function useCarrierActiveShipments(activeTab = "assigned") {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["carrierActiveShipments", activeTab],
    queryFn: async () => {
      const res = await getActiveShipments(activeTab);
      return res?.data || { shipments: [], counts: { assigned: 0, inTransit: 0 } };
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch shipments";
      toast.error(msg);
    },
  });

  return {
    shipments: data?.shipments || [],
    counts: data?.counts || { assigned: 0, inTransit: 0 },
    isLoading,
    error,
    refetch,
  };
}
