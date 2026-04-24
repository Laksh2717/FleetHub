import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { retireVehicle } from "../../../services/carrier/vehicles.service";
import { toast } from "react-hot-toast";

export function useRetireVehicle(vehicleId, onClose) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: retireVehicleMutation, isPending } = useMutation({
    mutationFn: async () => {
      return await retireVehicle(vehicleId);
    },
    onSuccess: () => {
      toast.success("Vehicle retired successfully");
      queryClient.invalidateQueries(["carrierVehicles"]);
      navigate("/carrier/dashboard/fleet?tab=retired");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to retire vehicle";
      toast.error(msg);
      onClose?.();
    },
  });

  return {
    retireVehicle: retireVehicleMutation,
    isRetiring: isPending,
  };
}
