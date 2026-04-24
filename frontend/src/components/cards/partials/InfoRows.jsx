import { formatCurrency, formatVehicleType } from "../../../utils/formatters";

export default function InfoRows({
  requiredVehicles,
  shipment,
  product,
  vehicle,
  estimatedTransitHours,
  amount
}) {
  const info = [];
  if (requiredVehicles) {
    info.push({ label: "Required Vehicles", value: formatVehicleType(requiredVehicles) });
  }
  if (shipment) {
    info.push({ label: "Shipment", value: shipment });
  }
  if (product) {
    info.push({ label: "Product", value: product });
  }
  if (vehicle) {
    info.push({ label: "Vehicle", value: vehicle });
  }
  if (amount) {
    info.push({ label: "Amount", value: `${formatCurrency(amount)}` });
  }
  if (estimatedTransitHours) {
    info.push({ label: "Est. Transit Hours", value: estimatedTransitHours });
  }

  return (
    <div className="space-y-2 mb-2 pb-2 border-b border-white/10">
      {info.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-sm text-gray-400 shrink-0">{item.label}:</span>
          <span className="text-white font-semibold text-md truncate">{item.value}</span>
        </div>
      ))}
    </div>
  );
}