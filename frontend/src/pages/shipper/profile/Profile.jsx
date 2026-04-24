import UpdateProfileModal from "../../../components/modals/UpdateProfileModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import {
  useShipperProfile,
  useUpdateShipperProfile,
  useDeleteShipperProfile,
} from "../../../hooks/shipper/profile";
import ConfirmationModal from "../../../components/modals/ConfirmationModal";
import InfoRow from "../../../components/ui/InfoRow";
import Button from "../../../components/ui/Button";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";

export default function Profile() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Guard: only shippers for now
  if (!user || user.role?.toLowerCase() !== "shipper") {
    navigate("/404");
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const { profile, isLoading: loading } = useShipperProfile();

  const { updateProfile, isUpdating: updating } = useUpdateShipperProfile({
    onSuccess: () => {
      setShowUpdateModal(false);
    },
  });

  const { deleteProfile, isDeleting: deleting } = useDeleteShipperProfile({
    onError: () => {
      setShowDeleteConfirm(false);
    },
  });

  const handleUpdateProfile = (updatedData) => {
    updateProfile(updatedData);
  };

  const handleDeleteProfile = () => {
    deleteProfile();
  };

  return (
    <DashboardLayout
      role={user.role?.toLowerCase()}
      companyName={user.companyName}
    >
      <div className="flex flex-col h-full">
        <div className="bg-black/40 border border-white/10 rounded-lg px-6 pt-6 pb-2 flex-1 overflow-y-auto">
          {loading && <PageLoader text="Loading profile..." />}

          {!loading && !profile && (
            <EmptyState
              title="No profile data available"
              description="Please update your profile."
            />
          )}

          {!loading && profile && (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-white mb-3">
                Profile Details
              </h1>

              <InfoRow
                label="Company Name"
                value={profile.companyName}
                textSize="text-lg"
              />
              <InfoRow
                label="GST Number"
                value={profile.gstNumber}
                textSize="text-lg"
              />
              <InfoRow
                label="Owner Name"
                value={profile.ownerName}
                textSize="text-lg"
              />
              <InfoRow label="Email" value={profile.email} textSize="text-lg" />
              <InfoRow label="Phone" value={profile.phone} textSize="text-lg" />
              <InfoRow
                label="Address"
                value={
                  profile.address
                    ? typeof profile.address === "object"
                      ? [profile.address.street, profile.address.city, profile.address.state, profile.address.pincode].filter(Boolean).join(", ")
                      : profile.address
                    : "-"
                }
                textSize="text-lg"
              />

              <div className="flex flex-wrap gap-3 justify-end pt-3 border-t border-white/10">
                <Button onClick={() => setShowUpdateModal(true)} size="lg">
                  Update Profile
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="danger"
                  size="lg"
                >
                  Delete Account
                </Button>
              </div>

              {showUpdateModal && (
                <UpdateProfileModal
                  profile={profile}
                  onUpdate={handleUpdateProfile}
                  onClose={() => setShowUpdateModal(false)}
                  isLoading={updating}
                />
              )}

              {showDeleteConfirm && (
                <ConfirmationModal
                  isOpen={showDeleteConfirm}
                  onClose={() => setShowDeleteConfirm(false)}
                  title="Delete Account"
                  message="Are you sure you want to delete your account? This action cannot be undone."
                  confirmText="Delete"
                  cancelText="Cancel"
                  onConfirm={handleDeleteProfile}
                  loading={deleting}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
