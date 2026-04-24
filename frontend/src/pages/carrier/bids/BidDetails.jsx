import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useBidDetails, useDeleteBid } from "../../../hooks/carrier/bids";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import ShipperDetails from "../../../components/details/ShipperDetails";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import VehicleDetails from "../../../components/details/VehicleDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import PageLoader from "../../../components/ui/PageLoader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ConfirmationModal from "../../../components/modals/ConfirmationModal";

export default function CarrierBidDetails() {
  const navigate = useNavigate();
  const { bidId } = useParams();
  const user = getStoredUser();

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { bid = null, isLoading: loading } = useBidDetails(bidId);
  const { deleteBid, isDeleting } = useDeleteBid(bidId);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const handleBack = () => {
    navigate("/carrier/dashboard/bids?tab=active");
  };

  const canWithdraw = (bid) => {
    if (!bid) return false;
    return (
      bid.bidStatus === "PENDING" &&
      bid.biddingDeadline &&
      new Date(bid.biddingDeadline) > new Date()
    );
  };

  const getBackRowRight = (bid) => {

    return (
      <div className="flex items-center gap-3">
        {canWithdraw(bid) && (
          <>
            <Button
              variant="danger"
              size="md"
              loading={isDeleting}
              onClick={() => setIsWithdrawModalOpen(true)}
            >
              Withdraw Bid
            </Button>
            <ConfirmationModal
              isOpen={isWithdrawModalOpen}
              onClose={() => setIsWithdrawModalOpen(false)}
              title="Withdraw Bid"
              message="Withdraw this bid? You can re-bid only before the deadline."
              confirmText="Withdraw"
              cancelText="Cancel"
              onConfirm={deleteBid}
              loading={isDeleting}
            />
          </>
        )}
      </div>
    );
  };

  const refRowRight = (bid) => {
    if (!bid) return null;

    const { budgetPrice, bidAmount } = bid;

    return (
      <div className="flex gap-3">
        <Badge
          text={`Budget Price : ₹${budgetPrice?.toLocaleString("en-IN") || "-"}`}
          variant="warning"
          size="lg"
        />
        <Badge
          text={`Bid Amount : ₹${bidAmount?.toLocaleString("en-IN") || "-"}`}
          variant="success"
          size="lg"
        />
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
        {loading && <PageLoader text="Loading bid details..." />}

        {/* Not Found */}
        {!loading && !bid && (
          <EmptyState
            title="Bid Not Found"
            description="The bid you are looking for does not exist."
          />
        )}

        {/* Content */}
        {!loading && bid && (
          <div className="flex-1 overflow-y-auto pr-4">
            <DetailsPageLayout
              onBack={handleBack}
              shipmentRef={bid.shipmentRef}
              backRowRight={getBackRowRight(bid)}
              refRowRight={refRowRight(bid)}
            >
              {/* Basic Info Section */}
              <BasicInfoSection
                info={{
                  shipperCompanyName: bid.shipperCompanyName,
                  receiverCompanyName: bid.receiverCompanyName,
                }}
              />

              {/* Shipper Details Section */}
              <ShipperDetails
                shipper={{
                  companyName: bid.shipperCompanyName,
                  ownerName: bid.shipperOwnerName,
                  email: bid.shipperEmail,
                  phone: bid.shipperPhone,
                  gstNumber: bid.shipperGstNumber,
                  address: bid.shipperAddress,
                }}
              />

              {/* Shipment Details Section */}
              <ShipmentDetails
                shipment={{
                  product: bid.product,
                  description: bid.description,
                  totalWeightTons: bid.totalWeightTons,
                  totalVolumeLitres: bid.totalVolumeLitres,
                  budgetPrice: bid.budgetPrice,
                  bidAmount: bid.bidAmount,
                  requiredVehicleTypes: bid.requiredVehicleTypes,
                }}
              />

              {/* Vehicle Details Section */}
              <VehicleDetails
                vehicle={{
                  vehicleNumber: bid.vehicleNumber,
                  vehicleType: bid.vehicleType,
                  capacityTons: bid.capacityTons,
                  capacityLitres: bid.capacityLitres,
                  manufacturingYear: bid.manufacturingYear,
                }}
              />

              {/* Locations & Timeline Section */}
              <TimelineAndLocations
                details={{
                  pickupLocation: bid.pickupLocation,
                  deliveryLocation: bid.deliveryLocation,
                  pickupDate: bid.pickupDate,
                  estimatedDeliveryDate: bid.estimatedDeliveryDate,
                  bidPlacedAt: bid.createdAt,
                }}
              />
            </DetailsPageLayout>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
