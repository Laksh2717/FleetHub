import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import PaymentModal from "../../../components/modals/PaymentModal";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperPendingPaymentDetails } from "../../../hooks/shipper/shipments";
import toast from "react-hot-toast";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import CarrierDetails from "../../../components/details/CarrierDetails";
import VehicleDetails from "../../../components/details/VehicleDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";

export default function PendingPaymentDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const user = getStoredUser();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Redirect check in useEffect to avoid render issues
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "shipper") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { shipment, isLoading: loading } =
    useShipperPendingPaymentDetails(shipmentId);

  const handleBack = () => navigate(`/shipper/dashboard/pending-payments`);

  const handlePaymentSuccess = () => {
    toast.success("Payment completed successfully!");

    // Navigate to shipment history
    setTimeout(() => {
      navigate(`/shipper/dashboard/shipment-history`);
    }, 1500);
  };

  const refRowRight = (shipment) => {
    if (!shipment) return null;

    return (
      <div className="flex items-center gap-4">
        <Badge
          text={`Amount Due: ₹${shipment.bidAmount?.toLocaleString("en-IN")}`}
          variant="danger"
          size="lg"
        />
        <Button
          onClick={() => setIsPaymentModalOpen(true)}
          variant="primary"
          size="lg"
        >
          Pay Now
        </Button>
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
        {!loading && !shipment && (
          <EmptyState
            title="Shipment Not Found"
            description="The requested shipment could not be found."
          />
        )}

        {/* Content */}
        {!loading && shipment && (
          <div className="flex-1 overflow-y-auto pr-4">
            <DetailsPageLayout
              onBack={handleBack}
              shipmentRef={shipment.shipmentRef}
              refRowRight={refRowRight(shipment)}
            >
              <BasicInfoSection
                info={{
                  carrierCompanyName: shipment.carrierCompanyName,
                  receiverCompanyName: shipment.receiverCompanyName,
                }}
              />

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
                  budgetPrice: shipment.budgetPrice,
                  bidAmount: shipment.bidAmount,
                  totalWeightTons: shipment.totalWeightTons,
                  totalVolumeLitres: shipment.totalVolumeLitres,
                  description: shipment.description,
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
                }}
              />
            </DetailsPageLayout>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && shipment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          shipmentId={shipmentId}
          amount={shipment.bidAmount * 100} // Convert to paise
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </DashboardLayout>
  );
}
