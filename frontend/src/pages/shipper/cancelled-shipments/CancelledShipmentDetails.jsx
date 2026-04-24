import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperCancelledShipmentDetails } from "../../../hooks/shipper/shipments";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Badge from "../../../components/ui/Badge";

export default function CancelledShipmentDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const user = getStoredUser();
  if (!user || user.role?.toLowerCase() !== "shipper") {
    navigate("/404");
  }

  const { shipment, isLoading: loading } =
    useShipperCancelledShipmentDetails(shipmentId);

  const handleBack = () => {
    navigate(`/shipper/dashboard/cancelled-shipments`);
  };

  return (
    <DashboardLayout
      role={user.role?.toLowerCase()}
      companyName={user.companyName}
    >
      <div className="flex flex-col h-full">

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
              refRowRight={<Badge text="Cancelled" variant="danger" size="lg" />}
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
                  cancelledAt: shipment.cancelledAt,
                  cancellationReason: shipment.cancellationReason,
                }}
              />
            </DetailsPageLayout>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
