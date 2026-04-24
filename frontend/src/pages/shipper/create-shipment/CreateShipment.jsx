import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCreateShipment } from "../../../hooks/shipper/shipments";
import { getAddress } from "../../../services/shipper/profile.service";
import toast from "react-hot-toast";
import TimePicker from "../../../components/ui/TimePicker";
import Input from "../../../components/ui/Input";
import AddressFields from "../../../components/form/AddressFields";
import VehicleTypeSelector from "../../../components/form/VehicleTypeSelector";
import Button from "../../../components/ui/Button";

export default function CreateShipment() {
    // Vehicle types available for selection
    const vehicleTypes = [
      "Trailed Flatbed",
      "Open Body",
      "Closed Container",
      "Tanker",
      "Refrigerated",
      "LCV",
    ];

    // Generic input change handler for all form fields
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    };

    // Handler for vehicle type selection logic
    const handleVehicleTypeChange = (vehicleType) => {
      setFormData((prev) => {
        const currentTypes = prev.vehicleTypes;
        let newVehicleTypes = [];
        const hasTankerInCurrent = currentTypes.includes("Tanker");
        const isTanker = vehicleType === "Tanker";
        if (currentTypes.includes(vehicleType)) {
          // Remove if already selected
          newVehicleTypes = currentTypes.filter((t) => t !== vehicleType);
        } else if (isTanker) {
          // Selecting Tanker clears all others
          newVehicleTypes = ["Tanker"];
        } else {
          if (hasTankerInCurrent) {
            // If Tanker is already selected, replace it with the new selection
            newVehicleTypes = [vehicleType];
          } else {
            // Add to existing non-Tanker selections
            newVehicleTypes = [...currentTypes, vehicleType];
          }
        }

        // Update weight/volume based on vehicle selection
        const newHasTanker = newVehicleTypes.includes("Tanker");

        return {
          ...prev,
          vehicleTypes: newVehicleTypes,
          totalWeightTons: newHasTanker ? "" : prev.totalWeightTons,
          totalVolumeLitres:
            !newHasTanker && newVehicleTypes.length > 0
              ? ""
              : prev.totalVolumeLitres,
        };
      });
      if (errors.vehicleTypes) {
        setErrors((prev) => ({ ...prev, vehicleTypes: "" }));
      }
    };
  const navigate = useNavigate();
  const user = getStoredUser();

  // Redirect if not a shipper
  if (!user || user.role?.toLowerCase() !== "shipper") {
    navigate("/404");
  }

  const [errors, setErrors] = useState({});
  const { handleCreateShipment, isPending: submitting } = useCreateShipment();

  const addressQuery = useQuery({
    queryKey: ["shipperAddress"],
    queryFn: async () => {
      const res = await getAddress();
      return res?.data?.address;
    },
    enabled: false,
  });

  const loadingAddress = addressQuery.isFetching;

  const [formData, setFormData] = useState({
    receiverCompanyName: "",
    budgetPrice: "",
    vehicleTypes: [],
    biddingDeadlineDate: "",
    biddingDeadlineHour: "09",
    biddingDeadlineMinute: "00",
    biddingDeadlineAmPm: "AM",
    pickupDate: "",
    pickupHour: "09",
    pickupMinute: "00",
    pickupAmPm: "AM",
    estimatedDeliveryDate: "",
    estimatedDeliveryHour: "09",
    estimatedDeliveryMinute: "00",
    estimatedDeliveryAmPm: "AM",
    totalWeightTons: "",
    totalVolumeLitres: "",
    pickupStreet: "",
    pickupCity: "",
    pickupState: "",
    pickupPincode: "",
    deliveryStreet: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryPincode: "",
  });

  const handleUseCompanyAddress = async () => {
    try {
      const address = await addressQuery
        .refetch()
        .then((result) => result.data);

      if (address) {
        setFormData((prev) => ({
          ...prev,
          pickupStreet: address.street || "",
          pickupCity: address.city || "",
          pickupState: address.state || "",
          pickupPincode: address.pincode || "",
        }));
        toast.success("Company address loaded successfully!");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to load company address";
      toast.error(msg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { errors: validationErrors } = handleCreateShipment(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors({});
    }
  };

  return (
    <DashboardLayout
      role={user.role?.toLowerCase()}
      companyName={user.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto pr-4">
          <form
            onSubmit={handleSubmit}
            className="bg-black/40 border border-white/10 rounded-lg p-6 space-y-6"
          >
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Receiver Company Name"
                  name="receiverCompanyName"
                  value={formData.receiverCompanyName}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Enter receiver company name"
                  error={errors.receiverCompanyName}
                  required
                />

                <Input
                  label="Product"
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Enter product name"
                  error={errors.product}
                  required
                />

                <Input
                  label="Budget Price (₹)"
                  name="budgetPrice"
                  type="number"
                  value={formData.budgetPrice}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Enter budget price"
                  error={errors.budgetPrice}
                  required
                />

                <div className="md:col-span-2">
                <VehicleTypeSelector
                  vehicleTypes={vehicleTypes}
                  selectedTypes={formData.vehicleTypes}
                  onChange={handleVehicleTypeChange}
                  error={errors.vehicleTypes}
                  disabled={submitting}
                />
                </div>

                <Input
                  label="Total Weight (Tons)"
                  name="totalWeightTons"
                  type="number"
                  value={formData.totalWeightTons}
                  onChange={handleChange}
                  disabled={
                    formData.vehicleTypes.includes("Tanker") || submitting
                  }
                  placeholder={
                    formData.vehicleTypes.includes("Tanker")
                      ? "Not applicable for Tanker"
                      : "Enter total weight"
                  }
                  error={errors.totalWeightTons}
                  required
                />

                <Input
                  label="Total Volume (Litres)"
                  name="totalVolumeLitres"
                  type="number"
                  value={formData.totalVolumeLitres}
                  onChange={handleChange}
                  disabled={
                    (formData.vehicleTypes.some((t) => t !== "Tanker") &&
                      formData.vehicleTypes.length > 0) ||
                    submitting
                  }
                  placeholder={
                    formData.vehicleTypes.some((t) => t !== "Tanker") &&
                    formData.vehicleTypes.length > 0
                      ? "Not applicable for non-Tanker vehicles"
                      : "Enter total volume"
                  }
                  error={errors.totalVolumeLitres}
                  required
                />
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Timeline
              </h2>
              <div className="space-y-6">
                <TimePicker
                  label="Bidding Deadline"
                  namePrefix="biddingDeadline"
                  dateValue={formData.biddingDeadlineDate}
                  hourValue={formData.biddingDeadlineHour}
                  minuteValue={formData.biddingDeadlineMinute}
                  amPmValue={formData.biddingDeadlineAmPm}
                  onDateChange={handleChange}
                  onHourChange={handleChange}
                  onMinuteChange={handleChange}
                  onAmPmChange={handleChange}
                  disabled={submitting}
                  error={errors.biddingDeadlineDate}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <TimePicker
                      label="Pickup Date & Time"
                      namePrefix="pickup"
                      dateValue={formData.pickupDate}
                      hourValue={formData.pickupHour}
                      minuteValue={formData.pickupMinute}
                      amPmValue={formData.pickupAmPm}
                      onDateChange={handleChange}
                      onHourChange={handleChange}
                      onMinuteChange={handleChange}
                      onAmPmChange={handleChange}
                      disabled={submitting}
                      error={errors.pickupDate}
                      required
                    />
                  </div>
                  <div>
                    <TimePicker
                      label="Estimated Delivery Date & Time"
                      namePrefix="estimatedDelivery"
                      dateValue={formData.estimatedDeliveryDate}
                      hourValue={formData.estimatedDeliveryHour}
                      minuteValue={formData.estimatedDeliveryMinute}
                      amPmValue={formData.estimatedDeliveryAmPm}
                      onDateChange={handleChange}
                      onHourChange={handleChange}
                      onMinuteChange={handleChange}
                      onAmPmChange={handleChange}
                      disabled={submitting}
                      error={errors.estimatedDeliveryDate}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup Location */}
            <AddressFields
              prefix="pickup"
              formData={formData}
              errors={errors}
              onChange={handleChange}
              disabled={submitting}
              onUseCompanyAddress={handleUseCompanyAddress}
              showUseCompanyAddress
              loadingAddress={loadingAddress}
            />

            {/* Delivery Location */}
            <AddressFields
              prefix="delivery"
              formData={formData}
              errors={errors}
              onChange={handleChange}
              disabled={submitting}
            />

            {/* Additional Information */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Additional Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:border-orange-500"
                  placeholder="Enter any additional details about the shipment"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                Create Shipment
              </Button>
              <Button
                onClick={() => navigate("/shipper/dashboard")}
                disabled={submitting}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
