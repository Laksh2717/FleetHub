import { formatDateTime } from "../../../utils/formatters";

export default function TimelineInfo({
  pickupDate,
  pickupConfirmedAt,
  estimatedDeliveryDate,
  deliveredAt,
  paidAt,
  expiresAt,
  biddingDeadline,
  bidPlacedAt,
  acceptedAt,
  cancelledAt,
  rejectedAt,
}) {
  const items = [];
  if (biddingDeadline)
    items.push({
      label: "Bidding Deadline",
      value: formatDateTime(biddingDeadline),
    });
  if (expiresAt)
    items.push({ label: "Expired At", value: formatDateTime(expiresAt) });
  if (pickupDate)
    items.push({ label: "Pickup At", value: formatDateTime(pickupDate) });
  if (bidPlacedAt)
    items.push({ label: "Bid Placed At", value: formatDateTime(bidPlacedAt) });
  // Only show Cancelled At if present, and do NOT show Rejected At in that case
  if (cancelledAt) {
    items.push({ label: "Cancelled At", value: formatDateTime(cancelledAt) });
  } else {
    if (acceptedAt)
      items.push({ label: "Accepted At", value: formatDateTime(acceptedAt) });
    if (rejectedAt)
      items.push({ label: "Rejected At", value: formatDateTime(rejectedAt) });
  }
  if (pickupConfirmedAt)
    items.push({
      label: "Pickup Confirmed",
      value: formatDateTime(pickupConfirmedAt),
    });
  if (estimatedDeliveryDate)
    items.push({
      label: "Est. Delivery",
      value: formatDateTime(estimatedDeliveryDate),
    });
  if (deliveredAt)
    items.push({ label: "Delivered At", value: formatDateTime(deliveredAt) });
  if (paidAt) items.push({ label: "Paid At", value: formatDateTime(paidAt) });

  return (
    <div className="space-y-2 text-xs">
      {items.map((item, idx) => (
        <div className="flex justify-between" key={idx}>
          <span className="text-orange-500">{item.label}:</span>
          <span className="text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
