import { capitalizeWords, formatCurrency, formatDateTime } from "../../utils/formatters";
import InfoRow from "../ui/InfoRow";

export default function BasicInfoSection({ info }) {
  if (!info) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg px-6 py-4">
      {info.title && (
        <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">
          {info.title}
        </h3>
      )}
      <div className="space-y-1">
        {info.shipperCompanyName && <InfoRow label="Shipper" value={capitalizeWords(info.shipperCompanyName)} />}

        {info.receiverCompanyName && <InfoRow label="Receiver" value={capitalizeWords(info.receiverCompanyName)} />}

        {info.carrierCompanyName && <InfoRow label="Carrier" value={capitalizeWords(info.carrierCompanyName)} />}

        {info.budgetPrice && <InfoRow label="Budget Price" value={formatCurrency(info.budgetPrice)} />}

        {info.bidAmount && <InfoRow label="Bid Amount" value={formatCurrency(info.bidAmount)} />}

        {info.estimatedTransitHours && <InfoRow label="Est. Transit" value={`${info.estimatedTransitHours} hours`} />}

        {info.bidPlacedOn && <InfoRow label="Bid Placed On" value={formatDateTime(info.bidPlacedOn)} />}
      </div>
    </div>
  );
}
