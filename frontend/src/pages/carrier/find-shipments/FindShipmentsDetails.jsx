import NotInterestedModal from "../../../components/modals/NotInterestedModal";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import {
  useCarrierFindShipmentDetails,
  useMarkShipmentNotInterested,
} from "../../../hooks/carrier/shipments";
import PlaceBidModal from "../../../components/modals/PlaceBidModal";
import { formatDateTime } from "../../../utils/formatters";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import ShipperDetails from "../../../components/details/ShipperDetails";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

export default function CarrierFindShipmentsDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const user = getStoredUser();

  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [showPlaceBidModal, setShowPlaceBidModal] = useState(false);

  // Redirect check in useEffect to avoid render issues
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { shipment, isLoading: loading } =
    useCarrierFindShipmentDetails(shipmentId);
  const { handleMarkNotInterested, isPending: isMarkingNotInterested } =
    useMarkShipmentNotInterested();

  const handleBack = () => {
    navigate(`/carrier/dashboard/find-shipments`);
  };

  const handleNotInterested = () => {
    handleMarkNotInterested(shipmentId);
  };

  const badge = (shipment) => {
    if (!shipment?.biddingDeadline) return null;

    const { biddingDeadline } = shipment;

    const now = new Date();
    const deadline = new Date(shipment.biddingDeadline);
    const hoursRemaining = (deadline - now) / (1000 * 60 * 60);

    return (
      <Badge
        text={`Closes: ${formatDateTime(biddingDeadline)}`}
        size="lg"
        variant={hoursRemaining <= 24 ? "danger" : "info"}
      />
    );
  };

  const refRowRight = (
    <div className="flex items-center gap-3">
      <Button
        onClick={() => setShowNotInterestedModal(true)}
        variant="ghost"
      >
        Not Interested
      </Button>
      <Button onClick={() => setShowPlaceBidModal(true)} variant="primary">
        Place Bid
      </Button>
    </div>
  );

  return (
    <DashboardLayout
      role={user?.role?.toLowerCase()}
      companyName={user?.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Loading */}
        {loading && <PageLoader text="Loading shipments..." />}

        {/* Not Found */}
        {!loading && !shipment && (
          <EmptyState
            title="Shipment not found or no longer available"
            description="The shipment you are looking for either does not exist or is no longer available."
          />
        )}

        {/* Content */}
        {!loading && shipment && (
          <div className="flex-1 overflow-y-auto pr-4">
            <DetailsPageLayout
              onBack={handleBack}
              shipmentRef={shipment.shipmentRef}
              backRowRight={badge(shipment)}
              refRowRight={refRowRight}
            >
              {/* Basic Info Section */}
              <BasicInfoSection
                info={{
                  shipperCompanyName: shipment.shipperCompanyName,
                  receiverCompanyName: shipment.receiverCompanyName,
                }}
              />

              {/* Shipper Details Section */}
              <ShipperDetails
                shipper={{
                  companyName: shipment.shipperCompanyName,
                  ownerName: shipment.shipperOwnerName,
                  email: shipment.shipperEmail,
                  phone: shipment.shipperPhone,
                  gstNumber: shipment.shipperGstNumber,
                  address: shipment.shipperAddress,
                }}
              />

              {/* Shipment Details Section */}
              <ShipmentDetails
                shipment={{
                  product: shipment.product,
                  description: shipment.description,
                  totalWeightTons: shipment.totalWeightTons,
                  totalVolumeLitres: shipment.totalVolumeLitres,
                  budgetPrice: shipment.budgetPrice,
                  requiredVehicleTypes: shipment.requiredVehicleTypes,
                }}
              />

              {/* Locations & Timeline Section */}
              <TimelineAndLocations
                details={{
                  pickupLocation: shipment.pickupLocation,
                  deliveryLocation: shipment.deliveryLocation,
                  pickupDate: shipment.pickupDate,
                  pickupConfirmedAt: shipment.pickupConfirmedAt,
                  estimatedDeliveryDate: shipment.estimatedDeliveryDate,
                  deliveredAt: shipment.deliveredAt,
                  estimatedTransitHours: shipment.estimatedTransitHours,
                  actualTransitHours: shipment.actualTransitHours,
                  paidAt: shipment.paidAt,
                }}
              />
            </DetailsPageLayout>
          </div>
        )}

        {/* Not Interested Confirmation Modal */}
        {showNotInterestedModal && (
          <NotInterestedModal
            onConfirm={handleNotInterested}
            onCancel={() => setShowNotInterestedModal(false)}
            isLoading={isMarkingNotInterested}
            shipmentRef={shipment?.shipmentRef}
          />
        )}

        {/* Place Bid Modal */}
        {showPlaceBidModal && (
          <PlaceBidModal
            shipmentId={shipmentId}
            shipmentRef={shipment?.shipmentRef}
            onClose={() => setShowPlaceBidModal(false)}
            onSuccess={() => {
              navigate("/carrier/dashboard/bids");
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
