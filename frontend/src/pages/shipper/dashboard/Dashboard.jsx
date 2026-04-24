import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperDashboard } from "../../../hooks/shipper/dashboard";
import KPIs from "../../../components/dashboard/KPIs";
import EarningsTrendChart from "../../../components/dashboard/EarningsTrendChart";
import ShipmentStatusPieChart from "../../../components/dashboard/ShipmentStatusPieChart";
import { MdCheckCircle, MdWarning } from "react-icons/md";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Card from "../../../components/cards/Card";
import Badge from "../../../components/ui/Badge";
import { getStatusBadge } from "../../../utils/badges/statusBadge";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const {
    dashboardData,
    kpis,
    attentionRequired,
    shipmentCostTrend,
    shipmentStatusDistribution,
    availableYears,
    shipmentRange,
    costYear,
    loading,
    statusLoading,
    costLoading,
    handleRangeChange,
    handleYearChange,
  } = useShipperDashboard();

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "shipper") {
      navigate("/404");
    }
  }, [user, navigate]);

  return (
    <DashboardLayout
      role={user?.role?.toLowerCase()}
      companyName={user?.companyName}
    >
      <div className="flex flex-col gap-6 h-full overflow-y-auto pr-4">
        {loading && <PageLoader text="Loading dashboard..." />}

        {!loading && !dashboardData && (
          <EmptyState title="No dashboard data available" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* LEFT COLUMN: Charts (66%) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <EarningsTrendChart
              title="Shipment Cost Trend"
              year={costYear}
              availableYears={availableYears}
              onYearChange={handleYearChange}
              total={shipmentCostTrend?.paidAmount}
              loading={costLoading}
              data={shipmentCostTrend.monthlyCost || []}
            />
            <ShipmentStatusPieChart
              title="Shipment Status"
              range={shipmentRange}
              onRangeChange={handleRangeChange}
              loading={statusLoading}
              data={shipmentStatusDistribution.distribution || []}
            />
          </div>
          {/* RIGHT COLUMN: KPIs (33%) */}
          <KPIs kpis={kpis} role="shipper" />
        </div>
        {/* Attention Required Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Attention Required
            </h2>
            <MdWarning className="text-red-500 text-2xl" />
          </div>
          {attentionRequired && attentionRequired.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {attentionRequired.map((item, idx) => {
                const badgeInfo = getStatusBadge(item.status);
                return (
                  <Card
                    key={item.shipmentId || idx}
                    shipmentRef={item.shipmentRef}
                    badge={
                      <Badge
                        text={badgeInfo.text}
                        variant={badgeInfo.variant}
                        size="sm"
                      />
                    }
                    partyInfo={{
                      receiver: item.receiverCompanyName,
                      carrier: item.carrierCompanyName,
                      isShipper: true,
                    }}
                    routeInfo={{ from: item.pickupCity, to: item.deliveryCity }}
                    infoRows={{ amount: item.amount ?? "-" }}
                    timelineInfo={{
                      deliveredAt:
                        item.timeLabel === "Delivered At"
                          ? item.timeValue
                          : undefined,
                      pickupDate:
                        item.timeLabel === "Pickup Date"
                          ? item.timeValue
                          : undefined,
                      expiresAt:
                        item.timeLabel === "Expires At"
                          ? item.timeValue
                          : undefined,
                    }}
                    onClick={() => {
                      if (item.status === "PAYMENT_PENDING") {
                        navigate("pending-payments");
                      } else if (item.status === "UNASSIGNED") {
                        navigate("unassigned-shipments");
                      } else if (item.status === "PICKUP_PENDING") {
                        navigate("active-shipments");
                      } else if (item.status === "IN_TRANSIT") {
                        navigate(`active-shipments/${item.shipmentId}`);
                      }
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-lg p-8 flex items-center justify-center">
              <p className="text-gray-400">No shipments requiring attention</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
