import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperUnassignedShipments } from "../../../hooks/shipper/shipments";
import Card from "../../../components/cards/Card";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Tabs from "../../../components/ui/Tabs";
import Badge from "../../../components/ui/Badge";
import { getDeadlineBadge } from "../../../utils/badges/closingBadge";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";

export default function UnassignedShipments() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Redirect if not a shipper
  if (!user || user.role?.toLowerCase() !== "shipper") {
    navigate("/404");
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "expired" ? "expired" : "open";

  const { shipments, isLoading: loading } =
    useShipperUnassignedShipments(activeTab);

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const getBadge = (shipment) => {
    if (!shipment) return null;

    if (activeTab === "expired") {
      return <Badge text="Expired" variant="neutral" size="sm" />;
    }

    const expiringBadge = getDeadlineBadge({
      date: shipment.expiresAt,
      type: "expiring",
    });
    if (expiringBadge.text) {
      return (
        <Badge
          text={expiringBadge.text}
          variant={expiringBadge.variant}
          size="sm"
        />
      );
    }

    const closingBadge = getDeadlineBadge({
      date: shipment.biddingDeadline,
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
  };

  return (
    <DashboardLayout
      role={user?.role?.toLowerCase()}
      companyName={user?.companyName}
    >
      <div className="flex flex-col h-full">
        <Tabs
          tabs={[
            { label: "Open Bidding", value: "open" },
            { label: "Expired", value: "expired" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

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
                      expiresAt: activeTab === "expired" ? shipment.expiresAt : null,
                      pickupDate: activeTab === "open" ? shipment.pickupDate : null,
                      estimatedDeliveryDate: activeTab === "open" ? shipment.estimatedDeliveryDate : null,
                    }}
                    onClick={() =>
                      navigate(
                        `/shipper/dashboard/unassigned-shipments/${shipment._id}?tab=${activeTab}`,
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
