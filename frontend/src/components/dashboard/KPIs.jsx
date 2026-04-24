import KPICard from "../cards/KPICard";
import { MdAttachMoney, MdLocalShipping, MdPayment, MdCheckCircle, MdWarning, MdDirectionsCar, MdStar } from "react-icons/md";
import { formatCurrency } from "../../utils/formatters";

export default function KPIs({ kpis = {}, role = "shipper" }) {
  if (role === "shipper") {
    return (
      <div className="hidden lg:flex flex-col gap-3 h-full">
        <KPICard
          label="Total Spend"
          value={formatCurrency(kpis?.totalSpend || 0)}
          icon={MdAttachMoney}
          color="text-green-500"
          hoverColor="hover:border-green-500"
          valueClass="text-green-400"
        />
        <KPICard
          label="Unassigned Shipments"
          value={kpis?.unassignedShipments || 0}
          icon={MdWarning}
          color="text-orange-500"
          hoverColor="hover:border-orange-500"
          valueClass="text-orange-400"
        />
        <KPICard
          label="Active Shipments"
          value={kpis?.activeShipments || 0}
          icon={MdLocalShipping}
          color="text-blue-500"
          hoverColor="hover:border-blue-500"
          valueClass="text-blue-400"
        />
        <KPICard
          label="Pending Payments"
          value={kpis?.pendingPayments?.count || 0}
          subValue={<span className="text-base text-yellow-400">({formatCurrency(kpis?.pendingPayments?.totalAmount || 0)})</span>}
          icon={MdPayment}
          color="text-yellow-500"
          hoverColor="hover:border-yellow-500"
          valueClass="text-yellow-400"
        />
        <KPICard
          label="Completed Shipments"
          value={kpis?.completedShipments || 0}
          icon={MdCheckCircle}
          color="text-emerald-500"
          hoverColor="hover:border-emerald-500"
          valueClass="text-emerald-400"
        />
      </div>
    );
  } else {
    return (
      <div className="hidden lg:flex flex-col gap-3 h-full">
        <KPICard
          label="Total Earnings"
          value={formatCurrency(kpis?.totalEarnings || 0)}
          icon={MdAttachMoney}
          color="text-green-500"
          hoverColor="hover:border-green-500"
          valueClass="text-green-400"
        />
        <KPICard
          label="Rating"
          value={(kpis?.rating?.average || 0).toFixed(1)}
          subValue={<span className="text-base text-orange-400">({kpis?.rating?.count || 0} ratings)</span>}
          icon={MdStar}
          color="text-orange-500"
          hoverColor="hover:border-orange-500"
          valueClass="text-orange-400"
        />
        <KPICard
          label="Active Shipments"
          value={kpis?.activeShipments || 0}
          icon={MdLocalShipping}
          color="text-blue-500"
          hoverColor="hover:border-blue-500"
          valueClass="text-blue-400"
        />
        <KPICard
          label="Pending Payments"
          value={kpis?.pendingPayments?.count || 0}
          subValue={<span className="text-base text-yellow-400">({formatCurrency(kpis?.pendingPayments?.totalAmount || 0)})</span>}
          icon={MdPayment}
          color="text-yellow-500"
          hoverColor="hover:border-yellow-500"
          valueClass="text-yellow-400"
        />
        <KPICard
          label="Completed Shipments"
          value={kpis?.completedShipments || 0}
          icon={MdCheckCircle}
          color="text-emerald-500"
          hoverColor="hover:border-emerald-500"
          valueClass="text-emerald-400"
        />
        <KPICard
          label="Fleet Size"
          value={kpis?.fleetSize || 0}
          subValue={<span className="text-base text-purple-400">({kpis?.vehiclesInUse || 0} in use)</span>}
          icon={MdDirectionsCar}
          color="text-purple-500"
          hoverColor="hover:border-purple-500"
          valueClass="text-purple-400"
        />
      </div>
    );
  }
}
