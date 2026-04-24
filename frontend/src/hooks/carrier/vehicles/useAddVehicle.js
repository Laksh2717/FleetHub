import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addVehicle } from "../../../services/carrier/vehicles.service";
import { toast } from "react-hot-toast";
import { validateAddVehicleForm } from "../../../utils/validations/addVehicleForm";

export function useAddVehicle(onSuccess, onClose) {
  const queryClient = useQueryClient();

  const { mutate: addVehicleMutation, isPending } = useMutation({
    mutationFn: async (payload) => {
      return await addVehicle(payload);
    },
    onSuccess: () => {
      toast.success("Vehicle added successfully");
      queryClient.invalidateQueries(["carrierVehicles"]);
      onSuccess?.();
      onClose?.();
    },
    onError: (error) => {
      console.error("Error adding vehicle:", error);
      toast.error(error.response?.data?.message || "Failed to add vehicle");
    },
  });

  const handleAddVehicle = (formData) => {
    // Validate form
    const errors = validateAddVehicleForm(formData);
    if (Object.keys(errors).length > 0) {
      return { errors };
    }

    const payload = {
      vehicleNumber: formData.vehicleNumber.toUpperCase().trim(),
      vehicleType: formData.vehicleType,
      capacityTons: formData.vehicleType === "TANKER" ? 0 : parseFloat(formData.capacityTons),
      capacityLitres: formData.vehicleType === "TANKER" ? parseFloat(formData.capacityLitres) : 0,
      manufacturingYear: parseInt(formData.manufacturingYear),
    };

    addVehicleMutation(payload);
    return { errors: {} };
  };

  return {
    handleAddVehicle,
    isPending,
  };
}
