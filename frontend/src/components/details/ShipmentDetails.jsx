// ShipmentDetails component for displaying shipment info
import InfoRow from "../ui/InfoRow";
import { capitalizeWords, formatVehicleType } from "../../utils/formatters";

export default function ShipmentDetails({ shipment }) {
  if (!shipment) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg px-6 py-4">
      <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">Shipment Details</h3>
      <div className="space-y-1">
        <InfoRow label="Product" value={capitalizeWords(shipment.product)} />
        {shipment.description && <InfoRow label="Description" value={shipment.description} />}
        {shipment.totalWeightTons > 0 && <InfoRow label="Weight" value={`${shipment.totalWeightTons} Tons`} />}
        {shipment.totalVolumeLitres > 0 && <InfoRow label="Volume" value={`${shipment.totalVolumeLitres} Litres`} />}
        <InfoRow label="Budget Price" value={shipment.budgetPrice ? `₹${shipment.budgetPrice.toLocaleString("en-IN")}` : "-"} />
        {shipment.bidAmount && <InfoRow label="Bid Amount" value={`₹${shipment.bidAmount.toLocaleString("en-IN")}`} />}
        {shipment.requiredVehicleTypes && (
          <InfoRow
            label="Required Vehicle Types"
            value={formatVehicleType(shipment.requiredVehicleTypes)}
          />
        )}
      </div>
    </div>
  );
}
