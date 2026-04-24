import { formatShortDateTime } from "../../../utils/formatters";

export default function TwoColumnInfo({
  budgetPrice,
  bidAmount,
  vehicleNumber,
  biddingDeadline,
  bidsReceived,
  estimatedTransitHours,
}) {
  const info = [];
  if (budgetPrice) {
    info.push({ label: "Budget Price", value: `${budgetPrice?.toLocaleString("en-IN")}` });
  }
  if (bidAmount) {
    info.push({ label: "Bid Price", value: `${bidAmount?.toLocaleString("en-IN")}` });
  }
  if (vehicleNumber) {
    info.push({ label: "Vehicle No.", value: vehicleNumber });
  }
  if (biddingDeadline) {
    info.push({ label: "Bidding Deadline", value: formatShortDateTime(biddingDeadline) });
  }
  if (bidsReceived) {
    info.push({ label: "Bids Received", value: bidsReceived });
  }
  if (bidsReceived === 0) {
    info.push({ label: "Bids Received", value: "0" });
  }
  if (estimatedTransitHours) {
    info.push({ label: "Est. Transit Hours", value: `${estimatedTransitHours} hrs` });
  }

  // Only show up to 2 columns
  const displayInfo = info.slice(0, 2);

  return (
    <div className="grid grid-cols-2 gap-3 mb-2 pb-2 border-b border-white/10">
      {displayInfo.map((item, idx) => (
        <div key={idx} className="flex flex-col items-start">
          <span className="text-xs text-gray-400 mb-1">{item.label}</span>
          <span className="text-white font-semibold text-lg break-words">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
