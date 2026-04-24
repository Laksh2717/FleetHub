import { useQuery } from "@tanstack/react-query";
import { getPendingPaymentShipments } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useShipperPendingPayments() {
  const { data: shipments = [], isLoading, error, refetch } = useQuery({
    queryKey: ["pendingPayments"],
    queryFn: async () => {
      const res = await getPendingPaymentShipments();
      return res?.data?.shipments || [];
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
}
