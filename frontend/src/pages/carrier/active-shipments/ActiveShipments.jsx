import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierActiveShipments } from "../../../hooks/carrier/shipments";
import Card from "../../../components/cards/Card";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Tabs from "../../../components/ui/Tabs";
import Badge from "../../../components/ui/Badge";
import { getShipmentBadge } from "../../../utils/badges/activeShipment";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";
import { formatVehicleType } from "../../../utils/formatters";

export default function CarrierActiveShipments() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "assigned";
  const [currentTime] = useState(() => Date.now());

  // Redirect check
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const { shipments, counts, isLoading: loading } =
    useCarrierActiveShipments(activeTab);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleShipmentClick = (shipment) => {
    navigate(`/carrier/dashboard/active-shipments/${shipment._id}?tab=${activeTab}`);
  };

  const badge = (shipment) => {
    const { text, variant } = getShipmentBadge(shipment, activeTab, currentTime);
    return <Badge text={text} variant={variant} size="sm" />;
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
            { label: `Assigned (${counts?.assigned ?? 0})`, value: "assigned" },
            { label: `In Transit (${counts?.inTransit ?? 0})`, value: "in-transit" },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {loading && <PageLoader text="Loading shipments..." />}

          {!loading && shipments.length === 0 && (
            <EmptyState
              title="No Shipments Found"
              description={`Your ${activeTab} shipments will appear here.`}
            />
          )}

          {!loading && shipments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.map((shipment) => {
                return (
                  <Card
                    key={shipment._id}
                    shipmentRef={shipment.shipmentRef}
                    badge={badge(shipment)}
                    partyInfo={{
                      shipper: shipment.shipperCompanyName,
                      receiver: shipment.receiverCompanyName,
                    }}
                    routeInfo={{
                      from: shipment.pickupCity,
                      to: shipment.deliveryCity,
                    }}
                    infoRows={{
                      product: shipment.product,
                      shipment: shipmentCapacity(shipment.totalWeightTons, shipment.totalVolumeLitres),
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
                    onClick={() => handleShipmentClick(shipment)}
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
