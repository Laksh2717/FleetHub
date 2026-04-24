import { validateLocation, validateShipmentDates } from "./validations";
import { createDateTime } from "../dateTimeHelpers";

export const validateCreateShipmentForm = (formData) => {
  const errors = {};

  // Validate required fields
  if (!formData.receiverCompanyName?.trim()) {
    errors.receiverCompanyName = "Receiver company name is required";
  }

  if (!formData.product?.trim()) {
    errors.product = "Product is required";
  }

  if (!formData.budgetPrice) {
    errors.budgetPrice = "Budget price is required";
  } else if (formData.budgetPrice <= 0) {
    errors.budgetPrice = "Budget price must be greater than 0";
  }

  if (formData.vehicleTypes.length === 0) {
    errors.vehicleTypes = "Please select at least one vehicle type";
  }

  // Weight validation (required unless only Tanker is selected)
  if (!formData.totalWeightTons && !formData.vehicleTypes.includes("Tanker")) {
    errors.totalWeightTons = "Total weight is required";
  } else if (
    formData.totalWeightTons &&
    formData.totalWeightTons <= 0 &&
    !formData.vehicleTypes.includes("Tanker")
  ) {
    errors.totalWeightTons = "Total weight must be greater than 0";
  }

  // Volume validation (required for Tanker)
  if (!formData.totalVolumeLitres && formData.vehicleTypes.includes("Tanker")) {
    errors.totalVolumeLitres = "Total volume is required for Tanker";
  } else if (
    formData.totalVolumeLitres &&
    formData.totalVolumeLitres <= 0 &&
    formData.vehicleTypes.includes("Tanker")
  ) {
    errors.totalVolumeLitres = "Total volume must be greater than 0";
  }

  // Timeline validations - dates required
  if (!formData.biddingDeadlineDate) {
    errors.biddingDeadlineDate = "Bidding deadline date is required";
  }

  if (!formData.pickupDate) {
    errors.pickupDate = "Pickup date is required";
  }

  if (!formData.estimatedDeliveryDate) {
    errors.estimatedDeliveryDate = "Estimated delivery date is required";
  }

  // Pickup location validation
  const pickupLocationCheck = validateLocation(
    {
      street: formData.pickupStreet,
      city: formData.pickupCity,
      state: formData.pickupState,
      pincode: formData.pickupPincode,
    },
    "Pickup"
  );

  if (!pickupLocationCheck.isValid) {
    pickupLocationCheck.errors.forEach((msg) => {
      if (msg.toLowerCase().includes("street")) errors.pickupStreet = msg;
      if (msg.toLowerCase().includes("city")) errors.pickupCity = msg;
      if (msg.toLowerCase().includes("state")) errors.pickupState = msg;
      if (msg.toLowerCase().includes("pincode")) errors.pickupPincode = msg;
    });
  }

  // Delivery location validation
  const deliveryLocationCheck = validateLocation(
    {
      street: formData.deliveryStreet,
      city: formData.deliveryCity,
      state: formData.deliveryState,
      pincode: formData.deliveryPincode,
    },
    "Delivery"
  );

  if (!deliveryLocationCheck.isValid) {
    deliveryLocationCheck.errors.forEach((msg) => {
      if (msg.toLowerCase().includes("street")) errors.deliveryStreet = msg;
      if (msg.toLowerCase().includes("city")) errors.deliveryCity = msg;
      if (msg.toLowerCase().includes("state")) errors.deliveryState = msg;
      if (msg.toLowerCase().includes("pincode")) errors.deliveryPincode = msg;
    });
  }

  // Pickup and delivery locations cannot be the same
  if (
    formData.pickupStreet?.trim().toLowerCase() ===
      formData.deliveryStreet?.trim().toLowerCase() &&
    formData.pickupCity?.trim().toLowerCase() ===
      formData.deliveryCity?.trim().toLowerCase() &&
    formData.pickupState?.trim().toLowerCase() ===
      formData.deliveryState?.trim().toLowerCase() &&
    formData.pickupPincode === formData.deliveryPincode
  ) {
    errors.deliveryStreet = "Pickup and delivery locations cannot be the same";
  }

  // Date and timeline order validations
  if (
    formData.biddingDeadlineDate &&
    formData.pickupDate &&
    formData.estimatedDeliveryDate
  ) {
    const biddingDt = createDateTime(
      formData.biddingDeadlineDate,
      formData.biddingDeadlineHour,
      formData.biddingDeadlineMinute,
      formData.biddingDeadlineAmPm
    );
    const pickupDt = createDateTime(
      formData.pickupDate,
      formData.pickupHour,
      formData.pickupMinute,
      formData.pickupAmPm
    );
    const deliveryDt = createDateTime(
      formData.estimatedDeliveryDate,
      formData.estimatedDeliveryHour,
      formData.estimatedDeliveryMinute,
      formData.estimatedDeliveryAmPm
    );

    const dateCheck = validateShipmentDates({
      biddingDeadline: biddingDt,
      pickupDate: pickupDt,
      estimatedDeliveryDate: deliveryDt,
    });

    if (!dateCheck.isValid) {
      if (dateCheck.errors.biddingDeadline) {
        errors.biddingDeadlineDate = dateCheck.errors.biddingDeadline;
      }
      if (dateCheck.errors.pickupDate) {
        errors.pickupDate = dateCheck.errors.pickupDate;
      }
      if (dateCheck.errors.estimatedDeliveryDate) {
        errors.estimatedDeliveryDate = dateCheck.errors.estimatedDeliveryDate;
      }
    }
  }

  return errors;
};