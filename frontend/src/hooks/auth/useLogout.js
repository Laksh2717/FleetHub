import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { logoutUser } from "../../services/auth/auth.service";
import { clearStoredUser } from "../../utils/authUtils";

export default function useLogout() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear user data from localStorage
      clearStoredUser();
      
      toast.success("Logged out successfully");
      
      // Navigate to login page
      navigate("/login");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      
      // Even if backend logout fails, clear local data and redirect
      clearStoredUser();
      
      toast.error("Logout failed, but local session cleared");
      navigate("/login");
    },
  });

  const openLogoutModal = () => setShowLogoutModal(true);

  const cancelLogout = () => setShowLogoutModal(false);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logoutMutation.mutate();
  };

  return {
    showLogoutModal,
    openLogoutModal,
    cancelLogout,
    confirmLogout,
    isLoggingOut: logoutMutation.isPending,
  };
}