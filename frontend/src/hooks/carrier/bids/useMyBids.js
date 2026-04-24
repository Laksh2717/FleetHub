import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMyBids } from "../../../services/carrier/bids.service";

export function useMyBids(activeTab = "active") {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["carrierMyBids", activeTab],
    queryFn: async () => {
      const res = await getMyBids(activeTab);
      return res?.data?.bids || [];
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch bids";
      toast.error(msg);
    },
  });

  return {
    bids: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}