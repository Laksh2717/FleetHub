import { useState } from "react";
import { MdStarRate } from "react-icons/md";
import toast from "react-hot-toast";
import { useRateCarrier } from "../../hooks/shipper/shipments";
import Modal from "./Modal";
import Button from "../ui/Button";

export default function RatingModal({ isOpen, shipmentId, carrierName, onClose, onSuccess }) {
  const [selectedRating, setSelectedRating] = useState(0);
  const { handleRateCarrier, isRating } = useRateCarrier(shipmentId, onClose, onSuccess);

  const handleSubmitRating = () => {
    if (selectedRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    handleRateCarrier(selectedRating);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-2">Rate Carrier</h2>
      <p className="text-gray-400 text-sm mb-6">
        Rate your experience with <span className="text-white font-semibold capitalize">{carrierName}</span>
      </p>

      {/* Stars Selection */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-6 mb-6">
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedRating(star)}
              className="transition transform hover:scale-110"
            >
              <MdStarRate
                size={48}
                className={selectedRating >= star ? "text-yellow-400" : "text-gray-600 hover:text-yellow-300"}
              />
            </button>
          ))}
        </div>
        {selectedRating > 0 && (
          <div className="text-center mt-4">
            <p className="text-xl font-bold text-yellow-400">
              {selectedRating === 1 && "Poor"}
              {selectedRating === 2 && "Fair"}
              {selectedRating === 3 && "Good"}
              {selectedRating === 4 && "Very Good"}
              {selectedRating === 5 && "Excellent"}
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-200">
          Your rating will help other shippers make informed decisions about this carrier.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <Button
          onClick={onClose}
          disabled={isRating}
          variant="ghost"
          className="w-1/2 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmitRating}
          disabled={isRating || selectedRating === 0}
          className="w-1/2 rounded-lg"
        >
          {isRating ? "Submitting..." : "Confirm & Rate"}
        </Button>
      </div>
    </Modal>
  );
}
