import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { deleteProfile } from "../../../services/shipper/profile.service";
import { clearStoredUser } from "../../../utils/authUtils";

export function useDeleteShipperProfile({ onSuccess, onError } = {}) {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: (data) => {
      clearStoredUser();
      toast.success("Account deleted successfully");
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to delete account";
      toast.error(msg);
      if (onError) {
        onError(error);
      }
    },
  });

  return {
    deleteProfile: mutation.mutate,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}