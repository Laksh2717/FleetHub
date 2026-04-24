import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getVehicleDetails } from "../../../services/carrier/vehicles.service";
import { toast } from "react-hot-toast";

export function useCarrierVehicleDetails(vehicleId) {
  const navigate = useNavigate();

  const { data: details = null, isLoading, error } = useQuery({
    queryKey: ["vehicleDetails", vehicleId],
    queryFn: async () => {
      const res = await getVehicleDetails(vehicleId);
      return res?.data || null;
    },
    enabled: !!vehicleId,
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch vehicle details";
      toast.error(msg);
      navigate("/carrier/dashboard/fleet?tab=all");
    },
  });

  return {
    details,
    isLoading,
    error,
  };
}
