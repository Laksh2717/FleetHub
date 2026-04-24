import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rateCarrier } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useRateCarrier(shipmentId, onClose, onSuccess) {
  const queryClient = useQueryClient();

  const { mutate: rateCarrierMutation, isPending } = useMutation({
    mutationFn: async (rating) => {
      return await rateCarrier(shipmentId, { rating });
    },
    onSuccess: () => {
      toast.success("Rating submitted successfully!");
      queryClient.invalidateQueries(["shipperActiveShipments"]);
      queryClient.invalidateQueries(["shipperShipmentHistory"]);
      queryClient.invalidateQueries(["shipperPendingPayments"]);
      onSuccess?.();
      onClose?.();
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || "Failed to submit rating";
      toast.error(msg);
      console.error("Rating error:", error);
    },
  });

  return {
    handleRateCarrier: rateCarrierMutation,
    isRating: isPending,
  };
}
