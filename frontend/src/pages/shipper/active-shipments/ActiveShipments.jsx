import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperActiveShipments } from "../../../hooks/shipper/shipments";
import Card from "../../../components/cards/Card";
import Tabs from "../../../components/ui/Tabs";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import { getShipmentBadge } from "../../../utils/badges/activeShipment";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";
import { formatVehicleType } from "../../../utils/formatters";

export default function ActiveShipments() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Redirect if not a shipper
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "shipper") {
      navigate("/404");
    }
  }, [user, navigate]);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "in-transit" ? "in-transit" : "assigned";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentTime] = useState(() => Date.now());

  const { shipments, counts, isLoading: loading } =
    useShipperActiveShipments(activeTab);

  // Keep URL in sync with selected tab for deep linking/back
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const badge = (shipment) => {
    const { text, variant } = getShipmentBadge(
      shipment,
      activeTab,
      currentTime,
    );
    return <Badge text={text} variant={variant} size="sm" />;
  };

  return (
    <DashboardLayout
      role={user.role?.toLowerCase()}
      companyName={user.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Tab Navigation - Fixed */}
        <Tabs
          tabs={[
            { label: `Assigned (${counts?.assigned ?? 0})`, value: "assigned" },
            { label: `In Transit (${counts?.inTransit ?? 0})`, value: "in-transit" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {/* Loading State */}
          {loading && <PageLoader text="Loading active shipments..." />}

          {/* Empty State */}
          {!loading && shipments.length === 0 && (
            <EmptyState
              title={`No ${activeTab} shipments found`}
              description={`Your ${activeTab} shipments will appear here`}
            />
          )}

          {/* Shipments Grid */}
          {!loading && shipments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.map((shipment) => {
                return (
                  <Card
                    key={shipment._id}
                    shipmentRef={shipment.shipmentRef}
                    badge={badge(shipment)}
                    partyInfo={{
                      receiver: shipment.receiverCompanyName,
                      carrier: shipment.carrierCompanyName,
                    }}
                    routeInfo={{
                      from: shipment.pickupCity,
                      to: shipment.deliveryCity,
                    }}
                    infoRows={{
                      product: shipment.product,
                      shipment: shipmentCapacity(
                        shipment.totalWeightTons,
                        shipment.totalVolumeLitres,
                      ),
                      vehicle: `${shipment.vehicleNumber} (${formatVehicleType(shipment.vehicleType)})`,
                    }}
                    twoColumnInfo={{
                      bidAmount: shipment.bidAmount,
                      estimatedTransitHours: shipment.estimatedTransitHours,
                    }}
                    timelineInfo={{
                      pickupDate: shipment.pickupDate,
                      pickupConfirmedAt: shipment.pickupConfirmedAt,
                      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
                    }}
                    activeTab={activeTab}
                    onClick={() =>
                      navigate(
                        `/shipper/dashboard/active-shipments/${shipment._id}?tab=${activeTab}`,
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
