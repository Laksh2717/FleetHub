import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperPendingPayments } from "../../../hooks/shipper/shipments";
import Card from "../../../components/cards/Card";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import PageHeader from "../../../components/ui/PageHeader";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";
import { formatVehicleType } from "../../../utils/formatters";

export default function PendingPayments() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Redirect if not a shipper
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "shipper") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { shipments, isLoading: loading } = useShipperPendingPayments();

  return (
    <DashboardLayout role={user.role?.toLowerCase()} companyName={user.companyName}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <PageHeader title="Pending Payments" subtitle="View and manage your shipments with pending payments." />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {/* Loading State */}
          {loading && <PageLoader text="Loading pending payments..." />}

          {/* Empty State */}
          {!loading && shipments.length === 0 && <EmptyState title="No Pending Payments" description="You have no shipments with pending payments at the moment." />}

          {/* Shipments Grid */}
          {!loading && shipments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.map((shipment) => (
                <Card
                  key={shipment._id}
                  shipmentRef={shipment.shipmentRef}
                  badge={<Badge text="Payment Due" variant="warning" size="sm" />}
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
                    pickupConfirmedAt: shipment.pickupConfirmedAt,
                    deliveredAt: shipment.deliveredAt,
                  }}
                  onClick={() => navigate(`/shipper/dashboard/pending-payments/${shipment._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

