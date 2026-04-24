import ConfirmationModal from "./ConfirmationModal";

export default function NotInterestedModal({ onConfirm, onCancel, isLoading, shipmentRef }) {
  return (
    <ConfirmationModal
      isOpen={true}
      onClose={onCancel}
      title="Mark as Not Interested"
      message={
        <div>
          <div className="mb-2">Are you sure you want to mark this shipment as not interested?</div>
          <div className="bg-black/40 border border-white/10 rounded p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Shipment Ref:</span>
              <span className="text-white font-semibold">{shipmentRef}</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            This shipment will no longer appear in your available shipments list.
          </div>
        </div>
      }
      confirmText={isLoading ? "Processing..." : "Mark as Not Interested"}
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={isLoading}
    />
  );
}
