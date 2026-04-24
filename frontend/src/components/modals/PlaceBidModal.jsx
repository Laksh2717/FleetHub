import { useState } from "react";
import Modal from "./Modal";
import { useAvailableVehiclesForBid } from "../../hooks/carrier/useAvailableVehiclesForBid";
import { usePlaceBid } from "../../hooks/carrier/bids";
import { validatePlaceBidForm } from "../../utils/validations/placeBidForm";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { formatVehicleType } from "../../utils/formatters";

export default function PlaceBidModal({
  shipmentId,
  shipmentRef,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    bidAmount: "",
    estimatedTransitHours: "",
    proposedVehicleId: "",
  });
  const { placeBid, isPlacing } = usePlaceBid({ onSuccess });
  const [errors, setErrors] = useState({});

  const { data: vehicles = [], isLoading: loadingVehicles } =
    useAvailableVehiclesForBid(shipmentId);

  const validateForm = () => {
    const newErrors = validatePlaceBidForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    placeBid({
      shipmentId,
      bidAmount: Number(formData.bidAmount),
      estimatedTransitHours: Number(formData.estimatedTransitHours),
      proposedVehicleId: formData.proposedVehicleId,
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const formatVehicleLabel = (vehicle) => {
    const type = formatVehicleType(vehicle.vehicleType);
    let capacity = "";
    if (vehicle.capacityTons && vehicle.capacityTons > 0) {
      capacity = `${vehicle.capacityTons} Tons`;
    } else if (vehicle.capacityLitres && vehicle.capacityLitres > 0) {
      capacity = `${vehicle.capacityLitres} Litres`;
    }
    return capacity
      ? `${vehicle.vehicleNumber} - ${type} (${capacity})`
      : `${vehicle.vehicleNumber} - ${type}`;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Place Bid">
      <div className="bg-black/40 border border-white/10 rounded p-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Shipment Ref:</span>
          <span className="text-white font-semibold">{shipmentRef}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Bid Amount (₹)"
          name="bidAmount"
          type="number"
          value={formData.bidAmount}
          onChange={(e) => handleChange("bidAmount", e.target.value)}
          disabled={isPlacing}
          placeholder="Enter bid amount"
          error={errors.bidAmount}
          required
        />
        <Input
          label="Estimated Transit Hours"
          name="estimatedTransitHours"
          type="number"
          value={formData.estimatedTransitHours}
          onChange={(e) =>
            handleChange("estimatedTransitHours", e.target.value)
          }
          disabled={isPlacing}
          placeholder="Enter estimated transit hours"
          error={errors.estimatedTransitHours}
          required
        />
        {loadingVehicles && (
          <div className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-md text-gray-400">
            Loading vehicles...
          </div>
        )}

        {!loadingVehicles && vehicles.length === 0 && (
          <div className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-md text-gray-400">
            No available vehicles
          </div>
        )}

        {!loadingVehicles && vehicles.length > 0 && (
          <Input
            label="Select Vehicle"
            name="proposedVehicleId"
            as="select"
            value={formData.proposedVehicleId}
            onChange={(e) => handleChange("proposedVehicleId", e.target.value)}
            disabled={isPlacing}
            error={errors.proposedVehicleId}
            required
          >
            <option value="">-- Select a vehicle --</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>
                {formatVehicleLabel(vehicle)}
              </option>
            ))}
          </Input>
        )}
        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <Button onClick={onClose} disabled={isPlacing} variant="ghost">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPlacing || loadingVehicles || vehicles.length === 0}
            loading={isPlacing}
          >
            {isPlacing ? "Submitting..." : "Place Bid"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
