import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import RatingModal from "../../../components/modals/RatingModal";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperShipmentHistoryDetails } from "../../../hooks/shipper/shipments";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import CarrierDetails from "../../../components/details/CarrierDetails";
import VehicleDetails from "../../../components/details/VehicleDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";

export default function ShipmentHistoryDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const user = getStoredUser();

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const {
    shipment,
    isLoading: loading,
    refetch,
  } = useShipperShipmentHistoryDetails(shipmentId);

  const handleBack = () => {
    navigate(`/shipper/dashboard/shipment-history`);
  };

  const handleRatingSuccess = () => {
    refetch();
  };

  const refRowRight = (shipment) => {
    if (!shipment) return null;

    const { isRated, ratingValue } = shipment;
    const ratingNumeric = Number(ratingValue);

    return (
      <div className="flex items-center gap-2">
        {isRated && Number.isFinite(ratingNumeric) ? (
          <Badge
            text={`Rated: ${ratingNumeric.toFixed(1)} ⭐`}
            variant="warning"
            size="lg"
          />
        ) : (
          <Badge text="Not Rated" variant="neutral" size="lg" />
        )}

        {!isRated && (
          <Button
            onClick={() => setIsRatingModalOpen(true)}
            variant="primary"
            size="lg"
          >
            Rate Now
          </Button>
        )}
      </div>
    );
  }; 

  return (
    <DashboardLayout
      role={user?.role?.toLowerCase()}
      companyName={user?.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Loading */}
        {loading && <PageLoader text="Loading shipment details..." />}

        {/* Not Found */}
        {!loading && !shipment && <EmptyState title="Shipment Not Found" description="The requested shipment could not be found." />}

        {/* Content */}
        {!loading && shipment && (
          <div className="flex-1 overflow-y-auto pr-4">
            <DetailsPageLayout
              onBack={handleBack}
              shipmentRef={shipment.shipmentRef}
              refRowRight={refRowRight(shipment)}
            >
              {/* Basic Info Section */}
              <BasicInfoSection
                info={{
                  carrierCompanyName: shipment.carrierCompanyName,
                  receiverCompanyName: shipment.receiverCompanyName,
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
                  bidAmount: shipment.bidAmount,
                  requiredVehicleTypes: shipment.requiredVehicleTypes,
                }}
              />

              {/* Carrier Details Section */}
              <CarrierDetails
                carrier={{
                  companyName: shipment.carrierCompanyName,
                  ownerName: shipment.carrierOwnerName,
                  email: shipment.carrierEmail,
                  phone: shipment.carrierPhone,
                  gstNumber: shipment.carrierGstNumber,
                  address: shipment.carrierAddress,
                  averageRating: shipment.carrierAverageRating,
                  ratingCount: shipment.carrierRatingCount,
                  fleetSize: shipment.carrierFleetSize,
                }}
              />

              {/* Vehicle Details Section */}
              <VehicleDetails
                vehicle={{
                  vehicleNumber: shipment.vehicleNumber,
                  vehicleType: shipment.vehicleType,
                  capacityTons: shipment.capacityTons,
                  capacityLitres: shipment.capacityLitres,
                  manufacturingYear: shipment.manufacturingYear,
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

      </div>

      {/* Rating Modal */}
      {isRatingModalOpen && shipment && (
        <RatingModal
          isOpen={isRatingModalOpen}
          shipmentId={shipmentId}
          carrierName={shipment.carrierCompanyName}
          onClose={() => setIsRatingModalOpen(false)}
          onSuccess={handleRatingSuccess}
        />
      )}
    </DashboardLayout>
  );
}
