import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierCompletedShipmentDetails } from "../../../hooks/carrier/shipments";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import ShipperDetails from "../../../components/details/ShipperDetails";
import VehicleDetails from "../../../components/details/VehicleDetails";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Badge from "../../../components/ui/Badge";

const getBadge = (shipment) => {
  const { isRated, ratingValue } = shipment;
  const ratingNumeric = Number(ratingValue);

  if (!isRated || !Number.isFinite(ratingNumeric)) {
    return <Badge text="Not Rated" variant="neutral" size="lg" />;
  }

  return <Badge text={`Rated: ${ratingNumeric.toFixed(1)} ⭐`} variant="warning" size="lg" />;
}

export default function CarrierShipmentHistoryDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const user = getStoredUser();

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { shipment, isLoading: loading } = useCarrierCompletedShipmentDetails(shipmentId);

  const handleBack = () => {
    navigate(`/carrier/dashboard/shipment-history`);
  };

  return (
    <DashboardLayout role={user?.role?.toLowerCase()} companyName={user?.companyName}>
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
              refRowRight={getBadge(shipment)}
            >
              {/* Basic Info Section */}
              <BasicInfoSection info={{
                shipperCompanyName: shipment.shipperCompanyName,
                receiverCompanyName: shipment.receiverCompanyName,
              }} />

              {/* Shipment Details Section */}
              <ShipmentDetails shipment={{
                product: shipment.product,
                description: shipment.description,
                totalWeightTons: shipment.totalWeightTons,
                totalVolumeLitres: shipment.totalVolumeLitres,
                budgetPrice: shipment.budgetPrice,
                bidAmount: shipment.bidAmount,
                requiredVehicleTypes: shipment.requiredVehicleTypes,
              }} />

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

              {/* Vehicle Details Section */}
              <VehicleDetails vehicle={{
                vehicleNumber: shipment.vehicleNumber,
                vehicleType: shipment.vehicleType,
                capacityTons: shipment.capacityTons,
                capacityLitres: shipment.capacityLitres,
                manufacturingYear: shipment.manufacturingYear,
              }} />

              {/* Locations & Timeline Section */}
              <TimelineAndLocations details={{
                pickupLocation: shipment.pickupLocation,
                deliveryLocation: shipment.deliveryLocation,
                pickupDate: shipment.pickupDate,
                pickupConfirmedAt: shipment.pickupConfirmedAt,
                estimatedDeliveryDate: shipment.estimatedDeliveryDate,
                deliveredAt: shipment.deliveredAt,
                estimatedTransitHours: shipment.estimatedTransitHours,
                actualTransitHours: shipment.actualTransitHours,
                paidAt: shipment.paidAt,
              }} />
            </DetailsPageLayout>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


