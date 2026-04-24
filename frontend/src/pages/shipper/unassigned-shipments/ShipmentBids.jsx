import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useOpenShipmentBids } from "../../../hooks/shipper/shipments";
import Card from "../../../components/cards/Card";
import Badge from "../../../components/ui/Badge";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";

export default function ShipmentBids() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const user = getStoredUser();

  // Auth guard - redirect if not a shipper
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "shipper") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { bids, isLoading: loading } = useOpenShipmentBids(shipmentId);

  const handleBack = () => {
    navigate(-1);
  };

  const handleBidClick = (bidId) => {
    navigate(`/shipper/dashboard/shipment-bids/${shipmentId}/bid/${bidId}`);
  };

  return (
    <DashboardLayout
      role={user.role?.toLowerCase()}
      companyName={user.companyName}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pr-4">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-white/20 text-white hover:border-orange-500/80 hover:text-orange-400 transition w-fit mb-4 cursor-pointer"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          {loading && <PageLoader text="Loading bids..." />}

          {!loading && bids.length === 0 && (
            <EmptyState title="No Bids" description="No bids received yet." />
          )}

          {!loading && bids.length > 0 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">
                Bids Received ({bids.length})
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bids.map((bid) => (
                  <Card
                    key={bid.bidId}
                    shipmentRef={bid.shipmentRef}
                    badge={
                      <Badge
                        text={`${bid.carrierAverageRating?.toFixed(1) || "-"} ⭐ (${bid.carrierRatingCount || 0})`}
                        variant="warning"
                        size="sm"
                      />
                    }
                    partyInfo={{ carrier: bid.carrierCompanyName }}
                    infoRows={{
                      vehicle: `${bid.vehicleNumber} (${bid.vehicleType})`,
                      vehicleCapacity: shipmentCapacity(
                        bid.vehicleCapacityTons,
                        bid.vehicleCapacityLitres,
                      ),
                      estimatedTransitHours: bid.estimatedTransitHours,
                    }}
                    twoColumnInfo={{
                      budgetPrice: bid.budgetPrice,
                      bidAmount: bid.bidAmount,
                    }}
                    timelineInfo={{ bidPlacedAt: bid.createdAt }}
                    onClick={() => handleBidClick(bid.bidId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
