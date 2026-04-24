import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getProfile } from "../../../services/shipper/profile.service";

export function useShipperProfile() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["shipperProfile"],
    queryFn: async () => {
      const res = await getProfile();
      return res?.data?.profile;
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to load profile";
      toast.error(msg);
    },
  });

  return {
    profile: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}