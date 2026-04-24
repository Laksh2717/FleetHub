import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { deleteVehicle } from "../../../services/carrier/vehicles.service";
import { toast } from "react-hot-toast";

export function useDeleteVehicle(vehicleId, onClose) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: deleteVehicleMutation, isPending } = useMutation({
    mutationFn: async () => {
      return await deleteVehicle(vehicleId);
    },
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      queryClient.invalidateQueries(["carrierVehicles"]);
      navigate("/carrier/dashboard/fleet?tab=all");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to delete vehicle";
      toast.error(msg);
      onClose?.();
    },
  });

  return {
    deleteVehicle: deleteVehicleMutation,
    isDeleting: isPending,
  };
}
