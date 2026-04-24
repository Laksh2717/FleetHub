import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAvailableVehiclesForBid } from "../../services/carrier/vehicles.service";

export function useAvailableVehiclesForBid(shipmentId) {
  return useQuery({
    queryKey: ["availableVehiclesForBid", shipmentId],
    queryFn: async () => {
      const res = await getAvailableVehiclesForBid(shipmentId);
      return res?.data?.vehicles || [];
    },
    enabled: !!shipmentId,
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to fetch available vehicles");
    },
  });
}
