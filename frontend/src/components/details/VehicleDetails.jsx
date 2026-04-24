import { formatVehicleType } from "../../utils/formatters";
import InfoRow from "../ui/InfoRow";

export default function VehicleDetails({ vehicle }) {
  if (!vehicle) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg px-6 py-4">
      <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">Vehicle Details</h3>
      <div className="space-y-1">
        <InfoRow label="Vehicle Number" value={vehicle.vehicleNumber || "-"} />
        <InfoRow label="Vehicle Type" value={formatVehicleType(vehicle.vehicleType)} />
        {vehicle.capacityTons > 0 && (
          <InfoRow label="Capacity (Tons)" value={`${vehicle.capacityTons} Tons`} />
        )}
        {vehicle.capacityLitres > 0 && (
          <InfoRow label="Capacity (Litres)" value={`${vehicle.capacityLitres} Litres`} />
        )}
        {vehicle.manufacturingYear && (
          <InfoRow label="Manufacturing Year" value={vehicle.manufacturingYear} />
        )}
      </div>
    </div>
  );
}
