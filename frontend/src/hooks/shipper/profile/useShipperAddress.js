import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAddress } from "../../../services/shipper/profile.service";

export function useShipperAddress() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["shipperAddress"],
    queryFn: async () => {
      const res = await getAddress();
      return res?.data?.address;
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to load address";
      toast.error(msg);
    },
  });

  return {
    address: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}