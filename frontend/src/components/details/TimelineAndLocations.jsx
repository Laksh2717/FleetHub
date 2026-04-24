// TimelineAndLocations component for displaying shipment timeline and locations
import InfoRow from "../ui/InfoRow";
import { formatDateTime, formatAddress, capitalizeWords } from "../../utils/formatters";

export default function TimelineAndLocations({ details }) {
  if (!details) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg px-6 py-4">
      <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">Locations & Timeline</h3>
      <div className="space-y-1">
        {details.pickupLocation && <InfoRow label="Pickup" value={capitalizeWords(formatAddress(details.pickupLocation))} />}

        {details.deliveryLocation && <InfoRow label="Delivery" value={capitalizeWords(formatAddress(details.deliveryLocation))} />}

        {details.pickupDate && <InfoRow label="Planned Pickup" value={formatDateTime(details.pickupDate)} />}

        {details.pickupConfirmedAt && <InfoRow label="Actual Pickup" value={formatDateTime(details.pickupConfirmedAt)} />}

        {details.estimatedDeliveryDate && <InfoRow label="Est. Delivery" value={formatDateTime(details.estimatedDeliveryDate)} />}

        {details.deliveredAt && <InfoRow label="Actual Delivery" value={formatDateTime(details.deliveredAt)} />}

        {details.estimatedTransitHours && <InfoRow label="Est. Transit Hours" value={`${details.estimatedTransitHours} hrs`} />}

        {details.actualTransitHours && <InfoRow label="Actual Transit Hours" value={`${details.actualTransitHours} hrs`} />}
        
        {details.paidAt && <InfoRow label="Paid At" value={formatDateTime(details.paidAt)} />}

        {details.biddingDeadline && <InfoRow label="Bidding Deadline" value={formatDateTime(details.biddingDeadline)} />}

        {details.expiresAt && <InfoRow label="Expires At" value={formatDateTime(details.expiresAt)} />}

        {details.expiredAt && <InfoRow label="Expired At" value={formatDateTime(details.expiredAt)} />}

        {details.bidPlacedAt && <InfoRow label="Bid Placed On" value={formatDateTime(details.bidPlacedAt)} />}     

        {details.cancelledAt && <InfoRow label="Cancelled At" value={formatDateTime(details.cancelledAt)} />}

        {details.cancellationReason && <InfoRow label="Cancellation Reason" value={capitalizeWords(details.cancellationReason)} />}
        </div>
    </div>
  );
}

