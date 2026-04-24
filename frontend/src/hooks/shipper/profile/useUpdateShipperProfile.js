import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateProfile } from "../../../services/shipper/profile.service";

export function useUpdateShipperProfile({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["shipperProfile"]);
      queryClient.invalidateQueries(["shipperAddress"]);
      toast.success("Profile updated successfully");
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to update profile";
      toast.error(msg);
      if (onError) {
        onError(error);
      }
    },
  });

  return {
    updateProfile: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}