import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierPendingPayments } from "../../../hooks/carrier/shipments";
import Card from "../../../components/cards/Card";
import Badge from "../../../components/ui/Badge";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import PageHeader from "../../../components/ui/PageHeader";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";
import { formatVehicleType } from "../../../utils/formatters";

export default function CarrierPendingPayments() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Redirect if not a carrier
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { shipments, isLoading: loading } = useCarrierPendingPayments();

  return (
    <DashboardLayout role={user.role?.toLowerCase()} companyName={user.companyName}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <PageHeader title="Pending Payments" subtitle="View all shipments with pending payments." />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {/* Loading State */}
          {loading && <PageLoader text="Loading pending payment shipments..." />}

          {/* Empty State */}
          {!loading && shipments.length === 0 && <EmptyState title="No Pending Payments" description="You have no delivered shipments awaiting payment." />}

          {/* Shipments Grid */}
          {!loading && shipments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.map((shipment) => (
                <Card
                  key={shipment._id}
                  shipmentRef={shipment.shipmentRef}
                  badge={<Badge text="Pending Payment" variant="warning" size="sm" />}
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
                    pickupConfirmedAt: shipment.pickupConfirmedAt,
                    deliveredAt: shipment.deliveredAt,
                  }}
                  onClick={() => navigate(`/carrier/dashboard/pending-payments/${shipment._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

