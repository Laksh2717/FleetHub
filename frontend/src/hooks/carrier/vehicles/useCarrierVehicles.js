import { useQuery } from "@tanstack/react-query";
import { getVehicles } from "../../../services/carrier/vehicles.service";
import { toast } from "react-hot-toast";

export function useCarrierVehicles(activeTab = "all") {
  const { data: vehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ["carrierVehicles", activeTab],
    queryFn: async () => {
      const res = await getVehicles(activeTab);
      return res?.data?.vehicles || [];
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch vehicles";
      toast.error(msg);
    },
  });

  return {
    vehicles,
    isLoading,
    error,
    refetch,
  };
}
