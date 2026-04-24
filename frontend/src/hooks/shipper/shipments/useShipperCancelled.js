import { useQuery } from "@tanstack/react-query";
import { getCancelledShipments } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useShipperCancelledShipments() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cancelledShipments"],
    queryFn: async () => {
      const res = await getCancelledShipments();
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
