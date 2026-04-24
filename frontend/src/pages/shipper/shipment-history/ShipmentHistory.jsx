import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import RatingModal from "../../../components/modals/RatingModal";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperShipmentHistory } from "../../../hooks/shipper/shipments";
import Card from "../../../components/cards/Card";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import PageHeader from "../../../components/ui/PageHeader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";
import { formatVehicleType } from "../../../utils/formatters";

export default function ShipmentHistory() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Redirect if not a shipper
  if (!user || user.role?.toLowerCase() !== "shipper") {
    navigate("/404");
  }

  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    shipmentId: null,
    carrierName: null,
  });

  const { shipments, isLoading: loading, refetch } = useShipperShipmentHistory();

  const getBadge = (shipment) => {
    if (!shipment) return null;

    const { isRated, ratingValue, _id, carrierCompanyName } = shipment;
    const ratingNumeric = Number(ratingValue);

    if (!isRated || !Number.isFinite(ratingNumeric)) {
      return (
        <Button size="sm" onClick={(e) => {
            e.stopPropagation();
            setRatingModal({
              isOpen: true,
              shipmentId: _id,
              carrierName: carrierCompanyName,
            });
          }}>Rate Now</Button>
      )
    }

    return (
      <Badge text={`Rated: ${ratingNumeric.toFixed(1)} ⭐`} variant="warning" size="sm" />
    )
  }

  return (
    <DashboardLayout role={user.role?.toLowerCase()} companyName={user.companyName}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <PageHeader title="Shipment History" subtitle="Completed and paid shipments" />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {/* Loading State */}
          {loading && <PageLoader text="Loading completed shipments..." />}

          {/* Empty State */}
          {!loading && shipments.length === 0 && <EmptyState title="No Completed Shipments" description="You have no completed and paid shipments yet." />}

          {/* Shipments Grid */}
          {!loading && shipments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.map((shipment) => (
                <Card
                  key={shipment._id}
                  shipmentRef={shipment.shipmentRef}
                  badge={getBadge(shipment)}
                  partyInfo={{
                    receiver: shipment.receiverCompanyName,
                    carrier: shipment.carrierCompanyName,
                  }}
                  routeInfo={{
                    from: shipment.pickupCity,
                    to: shipment.deliveryCity,
                  }}
                  infoRows={{
                    shipment: shipmentCapacity(shipment.totalWeightTons, shipment.totalVolumeLitres),
                    product: shipment.product,
                    vehicle: `${shipment.vehicleNumber} (${formatVehicleType(shipment.vehicleType)})`,
                  }}
                  twoColumnInfo={{
                    budgetPrice: shipment.budgetPrice,
                    bidAmount: shipment.bidAmount,
                  }}
                  timelineInfo={{
                    deliveredAt: shipment.deliveredAt,
                    paidAt: shipment.paidAt,
                  }}
                  showPaidBadge={true}
                  onClick={() => navigate(`/shipper/dashboard/shipment-history/${shipment._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        shipmentId={ratingModal.shipmentId}
        carrierName={ratingModal.carrierName}
        onClose={() => setRatingModal({ isOpen: false, shipmentId: null, carrierName: null })}
        onSuccess={refetch}
      />
    </DashboardLayout>
  );
}

