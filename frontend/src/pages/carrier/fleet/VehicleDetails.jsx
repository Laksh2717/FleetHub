import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierVehicleDetails, useDeleteVehicle, useRetireVehicle } from "../../../hooks/carrier/vehicles";
import { formatVehicleType } from "../../../utils/formatters";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import ConfirmationModal from "../../../components/modals/ConfirmationModal";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import { getStatusBadge } from "../../../utils/badges/statusBadge";

export default function CarrierVehicleDetails() {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const user = getStoredUser();

  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, title: "", message: "" });

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { details, isLoading: loading } = useCarrierVehicleDetails(vehicleId);
  const { deleteVehicle, isDeleting } = useDeleteVehicle(vehicleId, () => setConfirmModal({ open: false, action: null, title: "", message: "" }));
  const { retireVehicle, isRetiring } = useRetireVehicle(vehicleId, () => setConfirmModal({ open: false, action: null, title: "", message: "" }));

  const getBadge = (status) => {
    const { text, variant } = getStatusBadge(status);
    return <Badge text={text} variant={variant} size="lg" />;
  };

  const openDeleteModal = () => {
    setConfirmModal({
      open: true,
      action: "delete",
      title: "Delete Vehicle",
      message: `Are you sure you want to delete ${details?.vehicle?.vehicleNumber}? This action cannot be undone.`,
    });
  };

  const openRetireModal = () => {
    setConfirmModal({
      open: true,
      action: "retire",
      title: "Retire Vehicle",
      message: `Are you sure you want to retire ${details?.vehicle?.vehicleNumber}? It will be moved to the retired section.`,
    });
  };

  const handleConfirmAction = () => {
    const { action } = confirmModal;

    if (!action) return;

    if (action === "delete") {
      deleteVehicle();
    } else if (action === "retire") {
      retireVehicle();
    }
  };

  const handleCloseModal = () => {
    setConfirmModal({ open: false, action: null, title: "", message: "" });
  };

  const handleBack = () => {
    navigate("/carrier/dashboard/fleet?tab=all");
  };


  // Prevent destructuring if details is null
  const vehicle = details?.vehicle;
  const summary = details?.summary;
  const trips = details?.trips || [];
  const statusBadge = getBadge(summary?.currentStatus);

  return (
    <DashboardLayout role={user?.role?.toLowerCase()} companyName={user?.companyName}>
      <div className="flex flex-col h-full">
        {/* Loading */}
        {loading && <PageLoader text="Loading vehicle details..." />}

        {!loading && !vehicle && <EmptyState title="Vehicle not found" description="The requested vehicle does not exist." />}

        {/* Content */}
        {!loading && vehicle && (
          <div className="flex-1 overflow-y-auto pr-4 space-y-4">
            {/* Header Row: Back Button and Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-white/20 text-white hover:border-orange-500/80 hover:text-orange-400 transition cursor-pointer"
              >
                <span>←</span>
                <span>Back</span>
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={openDeleteModal} disabled={isDeleting || isRetiring} size="lg">Delete</Button>
                <Button onClick={openRetireModal} disabled={isDeleting || isRetiring} variant="ghost"  size="lg">Retire</Button>
              </div>
            </div>

            {/* Vehicle Details Card */}
            <div className="bg-black/40 border border-white/10 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Vehicle Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Vehicle Number */}
                <div>
                  <p className="text-sm text-orange-500 mb-2">Vehicle Number</p>
                  <p className="text-lg font-semibold text-white">{vehicle.vehicleNumber}</p>
                </div>

                {/* Vehicle Type */}
                <div>
                  <p className="text-sm text-orange-500 mb-2">Vehicle Type</p>
                  <p className="text-lg font-semibold text-white">{formatVehicleType(vehicle.vehicleType)}</p>
                </div>

                {/* Capacity */}
                <div>
                  <p className="text-sm text-orange-500 mb-2">Capacity</p>
                  <p className="text-lg font-semibold text-white">
                    {vehicle.capacityTons > 0 && `${vehicle.capacityTons} Tons`}
                    {vehicle.capacityLitres > 0 && `${vehicle.capacityLitres} Litres`}
                  </p>
                </div>

                {/* Manufacturing Year */}
                <div>
                  <p className="text-sm text-orange-500 mb-2">Manufacturing Year</p>
                  <p className="text-lg font-semibold text-white">{vehicle.manufacturingYear}</p>
                </div>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Trips */}
              <div className="bg-black/40 border border-white/10 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Total Trips Completed</p>
                <p className="text-3xl font-bold text-orange-500">{summary?.totalTrips || 0}</p>
              </div>

              {/* Total Earnings */}
              <div className="bg-black/40 border border-white/10 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Total Earnings</p>
                <p className="text-3xl font-bold text-green-400">₹{(summary?.totalEarnings || 0).toLocaleString("en-IN")}</p>
              </div>

              {/* Current Status */}
              <div className="bg-black/40 border border-white/10 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Current Status</p>
                {statusBadge}
              </div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Trip History</h2>

              {trips.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No completed trips yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-black/30 border border-white/10 rounded-lg">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm">
                        <th className="px-4 py-3">Shipment</th>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3">Earnings</th>
                        <th className="px-4 py-3">Transit Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((trip, idx) => (
                        <tr key={idx} className="hover:bg-orange-500/10 cursor-pointer transition">
                          <td className="px-4 py-3 text-orange-400 font-semibold">{trip.shipmentRef}</td>
                          <td className="px-4 py-3 text-white">{trip.pickupCity} → {trip.deliveryCity}</td>
                          <td className="px-4 py-3 text-green-400 font-semibold">₹{(trip.bidAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-white">{trip.actualTransitHours ? `${trip.actualTransitHours.toFixed(1)} hrs` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.open}
          onClose={handleCloseModal}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.action === "delete" ? (isDeleting ? "Deleting..." : "Delete") : (isRetiring ? "Retiring..." : "Retire")}
          cancelText="Cancel"
          onConfirm={handleConfirmAction}
          loading={isDeleting || isRetiring}
        />
      </div>
    </DashboardLayout>
  );
}

