import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { placeBid } from "../../../services/carrier/bids.service";

export function usePlaceBid({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: placeBid,
    onSuccess: (data) => {
      // Invalidate bids queries to refresh the lists
      queryClient.invalidateQueries(["carrierMyBids"]);
      queryClient.invalidateQueries(["carrierFindShipments"]);
      toast.success("Bid placed successfully!");
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to place bid";
      toast.error(msg);
      if (onError) {
        onError(error);
      }
    },
  });

  return {
    placeBid: mutation.mutate,
    isPlacing: mutation.isPending,
    error: mutation.error,
  };
}