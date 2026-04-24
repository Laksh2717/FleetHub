import Modal from "./Modal";
import { useCreatePaymentOrder } from "../../hooks/payments";
import Button from "../ui/Button";

export default function PaymentModal({
  isOpen,
  shipmentId,
  amount,
  onClose,
  onSuccess,
}) {
  const { initiatePayment, isProcessing } = useCreatePaymentOrder({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handlePayment = () => {
    initiatePayment(shipmentId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Payment">
      {/* Description */}
      <p className="text-gray-400 text-sm mb-6">
        Please review and confirm your payment details before proceeding.
      </p>

      {/* Amount Display */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-6 mb-6">
        <p className="text-gray-400 text-sm mb-2">Amount to Pay</p>
        <p className="text-4xl font-bold text-orange-500">
          ₹{(amount / 100).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-gray-500 mt-2">Powered by Razorpay</p>
      </div>

      {/* Info */}
      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-200">
          You will be redirected to Razorpay's secure payment gateway. This
          payment is in test mode.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <Button
          onClick={onClose}
          disabled={isProcessing}
          variant="ghost"
          className="w-1/2 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-1/2 rounded-lg"
        >
          {isProcessing ? "Processing..." : "Pay Now"}
        </Button>
      </div>
    </Modal>
  );
}
