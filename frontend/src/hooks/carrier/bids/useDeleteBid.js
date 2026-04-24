import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { deleteMyBid } from "../../../services/carrier/bids.service";
import toast from "react-hot-toast";

export function useDeleteBid(bidId) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    mutate: deleteBid,
    isLoading: isDeleting,
  } = useMutation({
    mutationFn: async () => {
      return await deleteMyBid(bidId);
    },
    onSuccess: () => {
      toast.success("Bid deleted successfully");
      queryClient.invalidateQueries(["carrierBidDetails", bidId]);
      queryClient.invalidateQueries(["carrierMyBids", "active"]);
      navigate("/carrier/dashboard/bids?tab=active");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to delete bid";
      toast.error(msg);
    },
  });

  return {
    deleteBid,
    isDeleting,
  };
}
