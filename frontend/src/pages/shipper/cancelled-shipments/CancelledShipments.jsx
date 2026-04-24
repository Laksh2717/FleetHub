import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperCancelledShipments } from "../../../hooks/shipper/shipments";
import Card from "../../../components/cards/Card";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Badge from "../../../components/ui/Badge";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";

export default function CancelledShipments() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Redirect if not a shipper
  if (!user || user.role?.toLowerCase() !== "shipper") {
    navigate("/404");
  }

  const { shipments, isLoading: loading } =
    useShipperCancelledShipments();

  const getBadge = (shipment) => {
    if (!shipment) return null;

    return (
        <Badge
          text="Cancelled"
          variant="danger"
          size="sm"
        />
      );
  };

  return (
    <DashboardLayout
      role={user?.role?.toLowerCase()}
      companyName={user?.companyName}
    >
      <div className="flex flex-col h-full">

        <div className="flex-1 overflow-y-auto pr-4">
          {loading && <PageLoader text="Loading shipments..." />}

          {!loading && shipments.length === 0 && (
            <EmptyState
              text="No shipments found"
              description="There are no shipments available in this category."
            />
          )}

          {!loading && shipments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.map((shipment) => {
                return (
                  <Card
                    key={shipment._id}
                    shipmentRef={shipment.shipmentRef}
                    badge={getBadge(shipment)}
                    partyInfo={{
                      receiver: shipment.receiverCompanyName,
                    }}
                    routeInfo={{
                      from: shipment.pickupCity,
                      to: shipment.deliveryCity,
                    }}
                    infoRows={{
                      shipment: shipmentCapacity(
                        shipment.totalWeightTons,
                        shipment.totalVolumeLitres,
                      ),
                      product: shipment.product,
                    }}
                    twoColumnInfo={{
                      bidsReceived: shipment.totalBids,
                      budgetPrice: shipment.budgetPrice,
                    }}
                    timelineInfo={{
                      biddingDeadline: shipment.biddingDeadline,
                      cancelledAt: shipment.cancelledAt,
                    }}
                    onClick={() =>
                      navigate(
                        `/shipper/dashboard/cancelled-shipments/${shipment._id}`,
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
