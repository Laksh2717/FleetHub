import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cancelShipment } from "../../../services/shipper/shipments.service";
import toast from "react-hot-toast";

export function useCancelShipment(shipmentId) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: handleCancelShipment, isPending: isCancelling } = useMutation({
    mutationFn: async (cancellationReason) => {
      return await cancelShipment(shipmentId, cancellationReason);
    },
    onSuccess: () => {
      toast.success("Shipment cancelled successfully");
      queryClient.invalidateQueries(["shipperCancelledShipments"]);
      queryClient.invalidateQueries(["shipperCancelledShipmentDetails", shipmentId]);
      navigate("/shipper/dashboard/cancelled-shipments");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || "Failed to cancel shipment";
      toast.error(msg);
      console.error("Cancel shipment error:", error);
    },
  });

  return {
    handleCancelShipment,
    isCancelling,
  };
}
