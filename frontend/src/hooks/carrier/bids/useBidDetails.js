import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getActiveBidDetails } from "../../../services/carrier/bids.service";

export function useBidDetails(bidId) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["carrierBidDetails", bidId],
    queryFn: async () => {
      const res = await getActiveBidDetails(bidId);
      return res?.data?.bid || null;
    },
    enabled: !!bidId,
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch bid details";
      toast.error(msg);
    },
  });

  return {
    bid: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}