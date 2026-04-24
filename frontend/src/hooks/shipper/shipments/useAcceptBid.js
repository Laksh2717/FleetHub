import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { acceptBid } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";

export function useAcceptBid(shipmentId, bidId, onClose) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: acceptBidMutation, isPending } = useMutation({
    mutationFn: async () => {
      console.log("[Bid Acceptance] Starting bid acceptance for bid:", bidId, "shipment:", shipmentId);
      return await acceptBid(shipmentId, { bidId });
    },
    onSuccess: (data) => {
      console.log("[Bid Acceptance] Success:", data);
      toast.success("Bid accepted successfully!");
      queryClient.invalidateQueries(["shipperUnassignedShipments"]);
      queryClient.invalidateQueries(["shipperActiveShipments"]);
      navigate("/shipper/dashboard/active-shipments");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || "Failed to accept bid";
      console.error("[Bid Acceptance] Error:", error);
      toast.error(msg);
      onClose?.();
    },
  });

  return {
    handleAcceptBid: acceptBidMutation,
    isAccepting: isPending,
  };
}
