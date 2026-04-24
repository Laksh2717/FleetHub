import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { confirmPickup } from "../../../services/carrier/shipments.service";

export const useConfirmPickup = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: handleConfirmPickup, isPending } = useMutation({
    mutationFn: async (shipmentId) => {
      return await confirmPickup(shipmentId);
    },
    onSuccess: () => {
      toast.success("Pickup confirmed successfully!");
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["carrierActiveShipments"] });
      queryClient.invalidateQueries({ queryKey: ["carrierActiveShipmentDetails"] });
      queryClient.invalidateQueries({ queryKey: ["carrierDashboard"] });
      // Navigate to active shipments
      navigate("/carrier/dashboard/active-shipments?tab=in-transit");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to confirm pickup";
      toast.error(msg);
    },
  });

  return {
    handleConfirmPickup,
    isPending,
  };
};
