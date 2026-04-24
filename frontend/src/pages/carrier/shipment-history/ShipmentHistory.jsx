import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierCompletedShipments } from "../../../hooks/carrier/shipments";
import Card from "../../../components/cards/Card";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import PageHeader from "../../../components/ui/PageHeader";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";
import { formatVehicleType } from "../../../utils/formatters";

export default function CarrierShipmentHistory() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Redirect if not a carrier
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { shipments, isLoading: loading } = useCarrierCompletedShipments();

  // Rating for carrier history
  const getRatingBadge = (shipment) => {
    const { isRated, ratingValue } = shipment;
    const ratingNumeric = Number(ratingValue);

    if (!isRated || !Number.isFinite(ratingNumeric)) {
      return <Badge text="Not Rated" variant="neutral" size="sm" />;
    }

    return <Badge text={`Rated: ${ratingNumeric.toFixed(1)} ⭐`} variant="warning" size="sm" />;
  }; 

  return (
    <DashboardLayout role={user.role?.toLowerCase()} companyName={user.companyName}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <PageHeader title="Shipment History" subtitle="View all your completed and paid shipments." />

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
                  badge={getRatingBadge(shipment)}
                  partyInfo={{
                    shipper: shipment.shipperCompanyName,
                    receiver: shipment.receiverCompanyName,
                  }}
                  routeInfo={{
                    from: shipment.pickupCity,
                    to: shipment.deliveryCity,
                  }}
                  infoRows={{
                    vehicle: `${shipment.vehicleNumber} (${formatVehicleType(shipment.vehicleType)})`,
                    shipment: shipmentCapacity(shipment.totalWeightTons, shipment.totalVolumeLitres),
                    product: shipment.product,
                  }}
                  twoColumnInfo={{
                    budgetPrice: shipment.budgetPrice,
                    bidAmount: shipment.bidAmount,
                  }}
                  timelineInfo={{
                    deliveredAt: shipment.deliveredAt,
                    paidAt: shipment.paidAt,
                  }}
                  onClick={() => navigate(`/carrier/dashboard/shipment-history/${shipment._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

