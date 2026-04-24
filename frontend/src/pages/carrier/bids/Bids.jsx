import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useMyBids } from "../../../hooks/carrier/bids";
import Card from "../../../components/cards/Card";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Tabs from "../../../components/ui/Tabs";
import Badge from "../../../components/ui/Badge";
import { getDeadlineBadge } from "../../../utils/badges/closingBadge";
import { getStatusBadge } from "../../../utils/badges/statusBadge";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";
import { formatVehicleType } from "../../../utils/formatters";

export default function CarrierBids() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(
    () => searchParams.get("tab") || "active",
    [searchParams],
  );

  // Redirect check
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { bids = [], isLoading: loading } = useMyBids(activeTab);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const getAcceptedBidBadgeInfo = (bid) => {
    const shipmentStatus = bid.shipmentStatus?.toUpperCase();
    const paymentStatus = bid.paymentStatus?.toUpperCase();

    if (shipmentStatus === "ASSIGNED") return "Assigned";
    if (shipmentStatus === "IN_TRANSIT") return "In Transit";
    if (shipmentStatus === "DELIVERED" && paymentStatus === "PENDING")
      return "Delivered";
    if (shipmentStatus === "DELIVERED" && paymentStatus === "COMPLETED")
      return "Completed";

    return null;
  };

  const handleBidClick = (bid) => {
    // Active bids - navigate to details page
    if (activeTab === "active") {
      navigate(`/carrier/dashboard/bids/${bid.bidId}`);
      return;
    }

    // Rejected bids - no action
    if (activeTab === "rejected") {
      return;
    }

    // Cancelled bids - no action
    if (activeTab === "cancelled") {
      return;
    }

    // Accepted bids - redirect based on shipment and payment status
    if (activeTab === "accepted") {
      const badgeInfo = getAcceptedBidBadgeInfo(bid);

      if (!badgeInfo) return;

      switch (badgeInfo) {
        case "Assigned":
          navigate(`/carrier/dashboard/active-shipments/${bid.shipmentId}`);
          break;
        case "In Transit":
          navigate(`/carrier/dashboard/active-shipments/${bid.shipmentId}`);
          break;
        case "Delivered":
          navigate(`/carrier/dashboard/pending-payments/${bid.shipmentId}`);
          break;
        case "Completed":
          navigate(`/carrier/dashboard/shipment-history/${bid.shipmentId}`);
          break;
        default:
          break;
      }
    }
  };

  const getReasonBadgeVariant = (reason) => {
    switch (reason?.toLowerCase()) {
      case "shipment expired":
        return "warning"; // yellow
      case "shipper cancelled":
        return "danger"; // red
      case "you cancelled":
        return "info"; // blue
      default:
        return "warning"; // fallback to orange/yellow
    }
  };

  const getBadge = (bid) => {
    if (activeTab === "rejected") {
      return <Badge text="Rejected" variant="danger" size="sm" />;
    } 
    
    else if (activeTab === "accepted") {
      const status = getAcceptedBidBadgeInfo(bid);
      const { text, variant } = getStatusBadge(status.toUpperCase().replace(" ", "_"));

      return <Badge text={text} variant={variant} size="sm" />;
    }
    
    else if (activeTab === "cancelled") {
      // Show the actual cancellation reason, capitalized and spaced
      let reasonText = bid.cancellationReason || "Cancelled";
      reasonText = reasonText
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return <Badge text={reasonText} variant={getReasonBadgeVariant(bid.cancellationReason)} size="sm" />;
    }
    
    else if (activeTab === "active") {
      const closingBadge = getDeadlineBadge({
        date: bid.biddingDeadline,
        type: "closing",
      });
      if (closingBadge.text) {
        return (
          <Badge
            text={closingBadge.text}
            variant={closingBadge.variant}
            size="sm"
          />
        );
      }
      return null;
    }
  };

  return (
    <DashboardLayout
      role={user?.role?.toLowerCase()}
      companyName={user?.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <Tabs
          tabs={[
            { label: "Active", value: "active" },
            { label: "Accepted", value: "accepted" },
            { label: "Rejected", value: "rejected" },
            { label: "Cancelled", value: "cancelled" },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {loading && <PageLoader text="Loading your bids..." />}

          {!loading && bids.length === 0 && (
            <EmptyState
              title="No Bids Found"
              description="You have not placed any bids in this category."
            />
          )}

          {!loading && bids.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                // Sort bids for accepted tab
                let sortedBids = [...bids];
                if (activeTab === "accepted") {
                  const statusOrder = {
                    Assigned: 1,
                    "In Transit": 2,
                    Delivered: 3,
                    Completed: 4,
                  };
                  sortedBids.sort((a, b) => {
                    const aStatus = getAcceptedBidBadgeInfo(a) || "";
                    const bStatus = getAcceptedBidBadgeInfo(b) || "";
                    const aOrder = statusOrder[aStatus] || 999;
                    const bOrder = statusOrder[bStatus] || 999;
                    return aOrder - bOrder;
                  });
                }
                return sortedBids;
              })().map((bid) => {
                // Cancelled bids: not clickable, show only cancelledAt in timeline
                const isClickable = activeTab === "active" || activeTab === "accepted";
                const timelineInfo = activeTab === "cancelled"
                  ? {
                      biddingDeadline: bid.biddingDeadline,
                      bidPlacedAt: bid.createdAt,
                      cancelledAt: bid.cancelledAt || bid.statusChangedOn,
                    }
                  : activeTab === "accepted"
                  ? {
                      biddingDeadline: bid.biddingDeadline,
                      bidPlacedAt: bid.createdAt,
                      acceptedAt: bid.statusChangedOn,
                    }
                  : activeTab === "rejected"
                  ? {
                      biddingDeadline: bid.biddingDeadline,
                      bidPlacedAt: bid.createdAt,
                      rejectedAt: bid.statusChangedOn,
                    }
                  : {
                      biddingDeadline: bid.biddingDeadline,
                      bidPlacedAt: bid.createdAt,
                    };
                return (
                  <Card
                    key={bid.bidId}
                    shipmentRef={bid.shipmentRef}
                    badge={getBadge(bid)}
                    partyInfo={{
                      shipper: bid.shipperCompanyName,
                      receiver: bid.receiverCompanyName,
                    }}
                    routeInfo={{
                      from: bid.pickupCity,
                      to: bid.deliveryCity,
                    }}
                    infoRows={{
                      vehicle: `${bid.vehicleNumber} (${formatVehicleType(bid.vehicleType)})`,
                      shipment: shipmentCapacity(bid.totalWeightTons, bid.totalVolumeLitres),
                      product: bid.product,
                    }}
                    twoColumnInfo={{
                      budgetPrice: bid.budgetPrice,
                      bidAmount: bid.bidAmount,
                    }}
                    timelineInfo={timelineInfo}
                    onClick={
                      isClickable ? () => handleBidClick(bid) : undefined
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
