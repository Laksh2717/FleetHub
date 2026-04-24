import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierVehicles } from "../../../hooks/carrier/vehicles";
import AddVehicleModal from "../../../components/modals/AddVehicleModal";
import { queryClient } from "../../../lib/queryClient";
import { formatVehicleType } from "../../../utils/formatters";
import Button from "../../../components/ui/Button";
import Tabs from "../../../components/ui/Tabs";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import { getStatusBadge } from "../../../utils/badges/statusBadge";

export default function CarrierFleet() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => searchParams.get("tab") || "all", [searchParams]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Redirect check
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { vehicles, isLoading: loading } = useCarrierVehicles(activeTab);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const getBadge = (status) => {
    const { text, variant } = getStatusBadge(status);
    return <Badge text={text} variant={variant} size="sm" />;
  };

  return (
    <DashboardLayout role={user?.role?.toLowerCase()} companyName={user?.companyName}>
      <div className="flex flex-col h-full">
        {/* Header with Tabs and Add Button */}
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          {/* Tabs */}
          <Tabs
            tabs={[
              { label: "All", value: "all" },
              { label: "Available", value: "available" },
              { label: "In Use", value: "in_use" },
              { label: "Retired", value: "retired" },
            ]}
            activeTab={activeTab}
            onChange={handleTabChange}
          />

          <Button onClick={() => setShowAddModal(true)} size="lg">Add Vehicle</Button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {loading && <PageLoader text="Loading vehicles..." />}

          {!loading && vehicles.length === 0 && <EmptyState title="No vehicles found" description="You have no vehicles in this category." />}

          {!loading && vehicles.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-black/40 border border-white/10 rounded-lg">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="px-4 py-3">Vehicle Number</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => {
                    const statusBadge = getBadge(vehicle.vehicleStatus);
                    return (
                      <tr
                        key={vehicle.vehicleId}
                        className="hover:bg-orange-500/10 cursor-pointer transition"
                        onClick={() => navigate(`/carrier/dashboard/fleet/${vehicle.vehicleId}`)}
                      >
                        <td className="px-4 py-3 font-semibold text-orange-500">{vehicle.vehicleNumber}</td>
                        <td className="px-4 py-3 text-white">{formatVehicleType(vehicle.vehicleType)}</td>
                        <td className="px-4 py-3 text-white">
                          {vehicle.vehicleType === "TANKER"
                            ? `${vehicle.capacityLitres} L`
                            : `${vehicle.capacityTons} Tons`}
                        </td>
                        <td className="px-4 py-3 text-white">{vehicle.manufacturingYear}</td>
                        <td className="px-4 py-3">
                          {statusBadge}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(["carrierVehicles"]);
          setShowAddModal(false);
        }}
      />
    </DashboardLayout>
  );
}

