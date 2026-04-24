import ConfirmationModal from "./ConfirmationModal";

export default function AcceptBidModal({
  isOpen,
  onConfirm,
  onCancel,
  isLoading,
  carrierName,
  bidAmount,
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Accept Bid"
      message={
        <div>
          <div className="mb-2">Are you sure you want to accept this bid?</div>
          <div className="bg-black/40 border border-white/10 rounded p-3 mb-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Carrier:</span>
              <span className="text-white font-semibold">{carrierName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Bid Amount:</span>
              <span className="text-orange-400 font-semibold">{bidAmount}</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            This action cannot be undone. The shipment will be assigned to this carrier.
          </div>
        </div>
      }
      confirmText={isLoading ? "Accepting..." : "Accept Bid"}
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={isLoading}
    />
  );
}
