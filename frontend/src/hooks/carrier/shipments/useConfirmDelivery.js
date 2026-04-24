import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { confirmDelivery } from "../../../services/carrier/shipments.service";

export const useConfirmDelivery = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: handleConfirmDelivery, isPending } = useMutation({
    mutationFn: async (shipmentId) => {
      return await confirmDelivery(shipmentId);
    },
    onSuccess: () => {
      toast.success("Delivery confirmed successfully!");
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["carrierActiveShipments"] });
      queryClient.invalidateQueries({ queryKey: ["carrierPendingPayments"] });
      queryClient.invalidateQueries({ queryKey: ["carrierDashboard"] });
      // Navigate to pending payments
      navigate("/carrier/dashboard/pending-payments");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to confirm delivery";
      toast.error(msg);
    },
  });

  return {
    handleConfirmDelivery,
    isPending,
  };
};
