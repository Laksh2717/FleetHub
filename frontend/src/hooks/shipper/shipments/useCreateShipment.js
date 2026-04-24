import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createShipment } from "../../../services/shipper/shipments.service";
import { toast } from "react-hot-toast";
import { validateCreateShipmentForm } from "../../../utils/validations/createShipmentForm";
import { createISODateTime } from "../../../utils/dateTimeHelpers";

export function useCreateShipment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: createShipmentMutation, isPending } = useMutation({
    mutationFn: async (payload) => {
      return await createShipment(payload);
    },
    onSuccess: () => {
      toast.success("Shipment created successfully!");
      queryClient.invalidateQueries(["shipperUnassignedShipments"]);
      navigate("/shipper/dashboard/unassigned-shipments");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || "Failed to create shipment";
      toast.error(msg);
    },
  });

  const handleCreateShipment = (formData) => {
    const errors = validateCreateShipmentForm(formData);
    if (Object.keys(errors).length > 0) {
      return { errors };
    }

    const vehicleTypeMap = {
      "Trailed Flatbed": "TRAILER_FLATBED",
      LCV: "LCV",
      "Open Body": "OPEN_BODY",
      "Closed Container": "CLOSED_CONTAINER",
      Tanker: "TANKER",
      Refrigerated: "REFRIGERATED",
    };

    const payload = {
      receiverCompanyName: formData.receiverCompanyName,
      budgetPrice: parseFloat(formData.budgetPrice),
      requiredVehicleTypes: formData.vehicleTypes.map((type) => vehicleTypeMap[type]),
      biddingDeadline: createISODateTime(
        formData.biddingDeadlineDate,
        formData.biddingDeadlineHour,
        formData.biddingDeadlineMinute,
        formData.biddingDeadlineAmPm
      ),
      pickupDate: createISODateTime(
        formData.pickupDate,
        formData.pickupHour,
        formData.pickupMinute,
        formData.pickupAmPm
      ),
      estimatedDeliveryDate: createISODateTime(
        formData.estimatedDeliveryDate,
        formData.estimatedDeliveryHour,
        formData.estimatedDeliveryMinute,
        formData.estimatedDeliveryAmPm
      ),
      totalWeightTons: formData.vehicleTypes.includes("Tanker") ? 0 : parseFloat(formData.totalWeightTons),
      totalVolumeLitres: formData.vehicleTypes.includes("Tanker") ? parseFloat(formData.totalVolumeLitres) : 0,
      pickupLocation: {
        street: formData.pickupStreet,
        city: formData.pickupCity,
        state: formData.pickupState,
        pincode: formData.pickupPincode,
      },
      deliveryLocation: {
        street: formData.deliveryStreet,
        city: formData.deliveryCity,
        state: formData.deliveryState,
        pincode: formData.deliveryPincode,
      },
      product: formData.product,
      description: formData.description,
    };

    createShipmentMutation(payload);
    return { errors: {} };
  };

  return {
    handleCreateShipment,
    isPending,
  };
}
