import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import {
  useOpenShipmentBidDetails,
  useAcceptBid,
} from "../../../hooks/shipper/shipments";
import { formatCurrency } from "../../../utils/formatters";
import AcceptBidModal from "../../../components/modals/AcceptBidModal";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import CarrierDetails from "../../../components/details/CarrierDetails";
import VehicleDetails from "../../../components/details/VehicleDetails";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import Button from "../../../components/ui/Button";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";

export default function BidDetails() {
  const navigate = useNavigate();
  const { shipmentId, bidId } = useParams();

  const user = getStoredUser();

  // Auth guard - redirect if not a shipper
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "shipper") {
      navigate("/404");
    }
  }, [user, navigate]);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const { handleAcceptBid, isAccepting } = useAcceptBid(shipmentId, bidId, () =>
    setShowAcceptModal(false)
  );
  const { bid, isLoading: loading } = useOpenShipmentBidDetails(
    shipmentId,
    bidId
  );

  const handleBack = () => {
    navigate(-1);
  };

  const refRowRight = () => (
    <Button
      onClick={() => setShowAcceptModal(true)}
      variant="primary"
      size="lg"
    >
      Accept Bid
    </Button>
  );

  return (
    <DashboardLayout
      role={user?.role?.toLowerCase()}
      companyName={user?.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Loading */}
        {loading && <PageLoader text="Loading Bid details..." />}

        {/* Not Found */}
        {!loading && !bid && (
          <EmptyState
            title="Bid Not Found"
            description="The requested bid could not be found."
          />
        )}

        {/* Content */}
        {!loading && bid && (
          <div className="flex-1 overflow-y-auto pr-4">
            <DetailsPageLayout
              onBack={handleBack}
              shipmentRef={bid.shipmentRef}
              refRowRight={refRowRight()}
            >
              <BasicInfoSection
                info={{
                  title: "Bid Information",
                  budgetPrice: bid.budgetPrice,
                  bidAmount: bid.bidAmount,
                  estimatedTransitHours: bid.estimatedTransitHours,
                  bidPlacedOn: bid.createdAt,
                }}
              />

              {/* Carrier Details */}
              <CarrierDetails
                carrier={{
                  companyName: bid.carrierCompanyName,
                  ownerName: bid.carrierOwnerName,
                  email: bid.carrierEmail,
                  phone: bid.carrierPhone,
                  gstNumber: bid.carrierGstNumber,
                  address: bid.carrierAddress,
                  averageRating: bid.carrierAverageRating,
                  ratingCount: bid.carrierRatingCount,
                  fleetSize: bid.carrierFleetSize,
                }}
              />

              {/* Vehicle Details */}
              <VehicleDetails
                vehicle={{
                  vehicleNumber: bid.vehicleNumber,
                  vehicleType: bid.vehicleType,
                  capacityTons: bid.capacityTons,
                  capacityLitres: bid.capacityLitres,
                  manufacturingYear: bid.manufacturingYear,
                }}
              />

              {/* Shipment Details */}
              <ShipmentDetails
                shipment={{
                  product: bid.product,
                  budgetPrice: bid.budgetPrice,
                  totalWeightTons: bid.totalWeightTons,
                  totalVolumeLitres: bid.totalVolumeLitres,
                  requiredVehicleTypes: bid.requiredVehicleTypes,
                  description: bid.description,
                }}
              />

              {/* Locations & Timeline */}
              <TimelineAndLocations
                details={{
                  pickupLocation: bid.pickupLocation,
                  deliveryLocation: bid.deliveryLocation,
                  pickupDate: bid.pickupDate,
                  estimatedDeliveryDate: bid.estimatedDeliveryDate,
                }}
              />

              {/* Accept Bid Modal */}
              <AcceptBidModal
                isOpen={showAcceptModal && !!bid}
                onConfirm={handleAcceptBid}
                onCancel={() => setShowAcceptModal(false)}
                isLoading={isAccepting}
                carrierName={bid?.carrierCompanyName}
                bidAmount={formatCurrency(bid?.bidAmount)}
              />
            </DetailsPageLayout>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
