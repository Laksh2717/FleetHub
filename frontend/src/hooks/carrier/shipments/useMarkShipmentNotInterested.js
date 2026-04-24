import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { markShipmentNotInterested } from "../../../services/carrier/shipments.service";

export const useMarkShipmentNotInterested = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: handleMarkNotInterested, isPending } = useMutation({
    mutationFn: async (shipmentId) => {
      return await markShipmentNotInterested(shipmentId);
    },
    onSuccess: () => {
      toast.success("Marked as not interested");
      // Invalidate find shipments query
      queryClient.invalidateQueries({ queryKey: ["findShipments"] });
      // Navigate back to find shipments
      navigate("/carrier/dashboard/find-shipments");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to mark as not interested";
      toast.error(msg);
    },
  });

  return {
    handleMarkNotInterested,
    isPending,
  };
};
