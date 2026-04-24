import { capitalizeWords, formatAddress } from "../../utils/formatters";
import InfoRow from "../ui/InfoRow";

export default function CarrierDetails({ carrier }) {
  if (!carrier) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg px-6 py-4">
      <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">Carrier Details</h3>
      <div className="space-y-1">
        <InfoRow label="Company" value={carrier.companyName || "-"} />
        {carrier.ownerName && <InfoRow label="Owner Name" value={carrier.ownerName} />}
        {carrier.email && <InfoRow label="Email" value={carrier.email} />}
        {carrier.phone && <InfoRow label="Phone" value={carrier.phone} />}
        {carrier.gstNumber && <InfoRow label="GST Number" value={carrier.gstNumber} />}

        {carrier.address && <InfoRow label="Address" value={capitalizeWords(formatAddress(carrier.address))} />}

        {carrier.averageRating !== undefined && (
          <InfoRow label="Rating" value={carrier.averageRating ? `${carrier.averageRating.toFixed(1)} / 5.0 (${carrier.ratingCount || 0} reviews)` : "Not rated yet"} />
        )}
        {carrier.fleetSize !== undefined && (
          <InfoRow label="Fleet Size" value={carrier.fleetSize ? `${carrier.fleetSize} vehicles` : "-"} />
        )}
      </div>
    </div>
  );
}
