import { useState } from "react";
import { useAddVehicle } from "../../hooks/carrier/vehicles";
import { validateAddVehicleForm } from "../../utils/validations/addVehicleForm";
import Modal from "./Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function AddVehicleModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleType: "",
    capacityTons: "",
    capacityLitres: "",
    manufacturingYear: "",
  });

  const [errors, setErrors] = useState({});
  const { handleAddVehicle, isPending } = useAddVehicle(onSuccess, onClose);
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateAddVehicleForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    handleAddVehicle(formData);
  };

  const vehicleTypes = [
    { value: "TANKER", label: "Tanker" },
    { value: "LCV", label: "LCV (Light Commercial Vehicle)" },
    { value: "TRAILER_FLATBED", label: "Trailer Flatbed" },
    { value: "OPEN_BODY", label: "Open Body" },
    { value: "CLOSED_CONTAINER", label: "Closed Container" },
    { value: "REFRIGERATED", label: "Refrigerated" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const isTanker = formData.vehicleType === "TANKER";

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-2xl font-semibold text-white mb-6">Add Vehicle</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Vehicle Number"
          name="vehicleNumber"
          type="text"
          value={formData.vehicleNumber}
          onChange={handleChange}
          placeholder="e.g., MH12AB1234"
          error={errors.vehicleNumber}
          required
        />
        <Input
          label="Vehicle Type"
          name="vehicleType"
          as="select"
          value={formData.vehicleType}
          onChange={handleChange}
          error={errors.vehicleType}
          required
        >
          <option value="">Select vehicle type</option>
          {vehicleTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Input>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Capacity (Tons)"
            name="capacityTons"
            type="number"
            value={formData.capacityTons}
            onChange={handleChange}
            placeholder="e.g., 10"
            error={errors.capacityTons}
            disabled={isTanker}
          />
          <Input
            label="Capacity (Litres)"
            name="capacityLitres"
            type="number"
            value={formData.capacityLitres}
            onChange={handleChange}
            placeholder="e.g., 12000"
            error={errors.capacityLitres}
            disabled={!isTanker}
          />
        </div>
        <Input
          label="Manufacturing Year"
          name="manufacturingYear"
          type="number"
          value={formData.manufacturingYear}
          onChange={handleChange}
          placeholder={`e.g., ${new Date().getFullYear() - 5}`}
          error={errors.manufacturingYear}
          required
        />
        <div className="flex gap-3 justify-end pt-4">
          <Button onClick={onClose} disabled={isPending} variant="ghost">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} loading={isPending}>
            {isPending ? "Adding..." : "Add Vehicle"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
