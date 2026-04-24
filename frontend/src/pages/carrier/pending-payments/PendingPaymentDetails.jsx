import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import ShipperDetails from "../../../components/details/ShipperDetails";
import VehicleDetails from "../../../components/details/VehicleDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierPendingPaymentDetails } from "../../../hooks/carrier/shipments";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";

export default function CarrierPendingPaymentDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const user = getStoredUser();

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { shipment, isLoading: loading } =
    useCarrierPendingPaymentDetails(shipmentId);

  const refRowRight = shipment ? (
    <Badge text={`Amount Due: ₹${shipment.bidAmount?.toLocaleString("en-IN")}`} variant="danger" size="lg" />
  ) : null;

  const handleBack = () => {
    navigate(`/carrier/dashboard/pending-payments`);
  };

  return (
    <DashboardLayout
      role={user?.role?.toLowerCase()}
      companyName={user?.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Loading */}
        {loading && <PageLoader text="Loading shipment details..." />}

        {!loading && !shipment && <EmptyState title="Shipment not found" description="The shipment you are looking for either does not exist or is no longer pending payment." />}

        {/* Content */}
        {!loading && shipment && (
          <div className="flex-1 overflow-y-auto pr-4">
            <DetailsPageLayout
              onBack={handleBack}
              shipmentRef={shipment.shipmentRef}
              refRowRight={refRowRight}
            >

              <BasicInfoSection info={{
                shipperCompanyName: shipment.shipperCompanyName,
                receiverCompanyName: shipment.receiverCompanyName,
              }}
                
              />

              {/* Shipment Details Section */}
              <ShipmentDetails
                shipment={{
                  product: shipment.product,
                  budgetPrice: shipment.budgetPrice,
                  bidAmount: shipment.bidAmount,
                  totalWeightTons: shipment.totalWeightTons,
                  totalVolumeLitres: shipment.totalVolumeLitres,
                  description: shipment.description,
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
                }}
              />
            </DetailsPageLayout>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
