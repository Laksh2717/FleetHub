import { capitalizeWords, formatAddress } from "../../utils/formatters";
import InfoRow from "../ui/InfoRow";

export default function ShipperDetails({ shipper }) {
  if (!shipper) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg px-6 py-4">
      <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">Shipper Details</h3>
      <div className="space-y-1">
        <InfoRow label="Company" value={shipper.companyName || "-"} />
        {shipper.ownerName && <InfoRow label="Owner Name" value={shipper.ownerName} />}
        {shipper.email && <InfoRow label="Email" value={shipper.email} />}
        {shipper.phone && <InfoRow label="Phone" value={shipper.phone} />}
        {shipper.gstNumber && <InfoRow label="GST Number" value={shipper.gstNumber} />}
        {shipper.address && <InfoRow label="Address" value={capitalizeWords(formatAddress(shipper.address))} />}
      </div>
    </div>
  );
}
