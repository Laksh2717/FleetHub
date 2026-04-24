import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperUnassignedShipmentDetails, useCancelShipment } from "../../../hooks/shipper/shipments";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import Tabs from "../../../components/ui/Tabs";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import { getDeadlineBadge } from "../../../utils/badges/closingBadge";

export default function UnassignedShipmentDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") === "expired" ? "expired" : "open";

  const user = getStoredUser();
  if (!user || user.role?.toLowerCase() !== "shipper") {
    navigate("/404");
  }

  const { shipment, isLoading: loading } =
    useShipperUnassignedShipmentDetails(shipmentId);

  const { handleCancelShipment, isCancelling } = useCancelShipment(shipmentId);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const derivedTab = useMemo(() => {
    if (tabParam) return tabParam;
    if (shipment?.status === "EXPIRED") return "expired";
    return "open";
  }, [shipment?.status, tabParam]);

  const getBadge = (shipment) => {
    if (!shipment) return null;

    if (derivedTab === "expired") {
      return <Badge text="Expired" variant="neutral" size="lg" />;
    }

    const expiringBadge = getDeadlineBadge({
      date: shipment.expiresAt,
      type: "expiring",
    });
    if (expiringBadge.text) {
      return (
        <Badge
          text={expiringBadge.text}
          variant={expiringBadge.variant}
          size="lg"
        />
      );
    }

    const closingBadge = getDeadlineBadge({
      date: shipment.biddingDeadline,
      type: "closing",
    });
    if (closingBadge.text) {
      return (
        <Badge
          text={closingBadge.text}
          variant={closingBadge.variant}
          size="lg"
        />
      );
    }
    return null;
  };

  const handleBack = () => {
    navigate(`/shipper/dashboard/unassigned-shipments?tab=${derivedTab}`);
  };

  const handleTabClick = (tab) => {
    navigate(`/shipper/dashboard/unassigned-shipments?tab=${tab}`);
  };

  const handleViewBids = () => {
    navigate(`/shipper/dashboard/shipment-bids/${shipmentId}`);
  };

  const refRowRight = (shipment) => {
    if (!shipment) return null;
    if (derivedTab === "expired") {
      return getBadge(shipment);
    }
    return (
      <div className="flex items-center gap-3">
        <Button 
          variant="danger" 
          onClick={() => setIsCancelModalOpen(true)}
          disabled={isCancelling}
        >
          Cancel Shipment
        </Button>
        <Button onClick={handleViewBids}>
          View Bids ({shipment.totalBids})
        </Button>
        {getBadge(shipment)}
      </div>
    );
  };

  return (
    <DashboardLayout
      role={user.role?.toLowerCase()}
      companyName={user.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <Tabs
          tabs={[
            { label: "Open Bidding", value: "open" },
            { label: "Expired", value: "expired" },
          ]}
          activeTab={derivedTab}
          onChange={handleTabClick}
        />

        <div className="flex-1 overflow-y-auto pr-4">
          {loading && <PageLoader text="Loading shipment details..." />}

          {!loading && !shipment && (
            <EmptyState
              title="Shipment Not Found"
              description="The requested shipment could not be found."
            />
          )}

          {!loading && shipment && (
            <DetailsPageLayout
              onBack={handleBack}
              shipmentRef={shipment.shipmentRef}
              refRowRight={refRowRight(shipment)}
            >
              {/* Basic Info Section */}
            <BasicInfoSection
                info={{
                  shipperCompanyName: shipment.shipperCompanyName,
                  receiverCompanyName: shipment.receiverCompanyName,
                }}
            />

              {/* Shipment Details Section */}
              <ShipmentDetails
                shipment={{
                  product: shipment.product,
                  budgetPrice: shipment.budgetPrice,
                  totalWeightTons: shipment.totalWeightTons,
                  totalVolumeLitres: shipment.totalVolumeLitres,
                  requiredVehicleTypes: shipment.requiredVehicleTypes,
                  description: shipment.description,
                }}
              />

              {/* Locations & Timeline Section */}
              <TimelineAndLocations
                details={{
                  pickupLocation: shipment.pickupLocation,
                  deliveryLocation: shipment.deliveryLocation,
                  pickupDate: shipment.pickupDate,
                  estimatedDeliveryDate: shipment.estimatedDeliveryDate,
                  biddingDeadline: shipment.biddingDeadline,
                  expiresAt: derivedTab === "open" ? shipment.expiresAt : null,
                  expiredAt:
                    derivedTab === "expired" ? shipment.expiresAt : null,
                }}
              />
              
              {isCancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Cancel Shipment
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Are you sure you want to cancel this shipment? This action cannot be undone.
                    </p>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Optional: Enter reason for cancellation"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
                      rows="3"
                      disabled={isCancelling}
                    />
                    <div className="flex gap-3 justify-end">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setIsCancelModalOpen(false);
                          setCancellationReason("");
                        }} 
                        disabled={isCancelling}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="danger"
                        onClick={() => handleCancelShipment(cancellationReason)}
                        loading={isCancelling}
                      >
                        Confirm Cancelation
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DetailsPageLayout>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
