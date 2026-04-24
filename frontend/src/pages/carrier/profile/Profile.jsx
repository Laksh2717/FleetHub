import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierProfile, useUpdateCarrierProfile, useDeleteCarrierProfile } from "../../../hooks/carrier/profile";
import ConfirmationModal from "../../../components/modals/ConfirmationModal";
import UpdateProfileModal from "../../../components/modals/UpdateProfileModal";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import InfoRow from "../../../components/ui/InfoRow";
import Button from "../../../components/ui/Button";

export default function CarrierProfile() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Guard: only carriers
  if (!user || user.role?.toLowerCase() !== "carrier") {
    navigate("/404");
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const { profile, isLoading: loading } = useCarrierProfile();
  
  const { updateProfile, isUpdating: updating } = useUpdateCarrierProfile({
    onSuccess: () => {
      setShowUpdateModal(false);
    },
  });

  const { deleteProfile, isDeleting: deleting } = useDeleteCarrierProfile({
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
    <DashboardLayout role={user.role?.toLowerCase()} companyName={user.companyName}>
      <div className="flex flex-col h-full">
        <div className="bg-black/40 border border-white/10 rounded-lg px-6 pt-6 pb-2 flex-1 overflow-y-auto">
          {loading && <PageLoader message="Loading profile..." />}

          {!loading && !profile && (
            <EmptyState title="Profile not found" description="We couldn't find a profile for this carrier." />
          )}

          {!loading && profile && (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-white mb-3">Profile Details</h1>

               <InfoRow label="Company Name" value={profile.companyName} textSize="text-lg" />
               <InfoRow label="GST Number" value={profile.gstNumber} textSize="text-lg" />
               <InfoRow label="Owner Name" value={profile.ownerName} textSize="text-lg" />
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
               <InfoRow label="Fleet Size" value={profile.fleetSize ? `${profile.fleetSize} vehicles` : "-"} textSize="text-lg" />

              <InfoRow
                label="Average Rating"
                value={profile.averageRating ? `${profile.averageRating.toFixed(1)} ★ (${profile.ratingCount || 0} ${profile.ratingCount === 1 ? "rating" : "ratings"})` : "Not rated yet"}
                textSize="text-lg"
              />
               <div className="flex flex-wrap gap-3 justify-end pt-3 border-t border-white/10">
                  <Button onClick={() => setShowUpdateModal(true)} disabled={updating} size="lg">Update Profile</Button>
                  <Button onClick={() => setShowDeleteConfirm(true)} disabled={deleting} size="lg" variant="danger">Delete Profile</Button>
               </div>
               {showUpdateModal && (
                <UpdateProfileModal
                  profile={profile}
                  onUpdate={handleUpdateProfile}
                  onClose={() => setShowUpdateModal(false)}
                  isLoading={updating}
                  isCarrier={true}
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
)}  