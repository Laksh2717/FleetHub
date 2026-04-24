import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getPendingPaymentShipments } from "../../../services/carrier/shipments.service";

export const useCarrierPendingPayments = () => {
  const { data: shipments = [], isLoading, error, refetch } = useQuery({
    queryKey: ["carrierPendingPayments"],
    queryFn: async () => {
      const response = await getPendingPaymentShipments();
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
