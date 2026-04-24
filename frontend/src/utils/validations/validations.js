// Client-side validation helpers aligned with backend rules

export const isEmpty = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
};

export const isEmailValid = (email) => {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

export const isPhoneNumberValid = (phone) => {
  if (!phone) return false;
  const regex = /^[6-9]\d{9}$/;
  return regex.test(String(phone));
};

export const isGSTValid = (gst) => {
  if (!gst) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(String(gst).toUpperCase());
};

export const isVehicleNumberValid = (vehicleNumber) => {
  if (!vehicleNumber) return false;
  const regex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
  return regex.test(String(vehicleNumber).toUpperCase());
};

export const isManufacturingYearValid = (year) => {
  if (!year) return false;
  const currentYear = new Date().getFullYear();
  const numericYear = Number(year);
  return Number.isInteger(numericYear) && numericYear >= 1900 && numericYear <= currentYear;
};

export const isPasswordValid = (password) => {
  if (!password) return false;
  return password.length >= 6;
};

export const validateShipmentDates = ({
  biddingDeadline,
  pickupDate,
  estimatedDeliveryDate,
  toleranceMinutes = 5,
}) => {
  const errors = {};

  const now = new Date();
  now.setMinutes(now.getMinutes() - toleranceMinutes);

  const parseDate = (value) => {
    const date = new Date(value);
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  };

  const bidding = parseDate(biddingDeadline);
  const pickup = parseDate(pickupDate);
  const delivery = parseDate(estimatedDeliveryDate);

  if (!bidding) errors.biddingDeadline = "Invalid bidding deadline date";
  if (!pickup) errors.pickupDate = "Invalid pickup date";
  if (!delivery) errors.estimatedDeliveryDate = "Invalid delivery date";

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  if (bidding < now) {
    errors.biddingDeadline = "Bidding deadline cannot be in the past";
  }

  if (pickup < now) {
    errors.pickupDate = "Pickup date cannot be in the past";
  }

  if (delivery < now) {
    errors.estimatedDeliveryDate = "Delivery date cannot be in the past";
  }

  if (bidding >= pickup) {
    errors.biddingDeadline = "Bidding deadline must be before pickup date";
  }

  if (pickup >= delivery) {
    errors.pickupDate = "Pickup date must be before delivery date";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, data: { biddingDeadline: bidding, pickupDate: pickup, estimatedDeliveryDate: delivery } };
};

export const validateLocation = (location, label = "Location") => {
  const errors = [];

  if (!location || typeof location !== "object") {
    return { isValid: false, errors: [`${label} is required and must be an object`] };
  }

  const { street, city, state, pincode } = location;

  if (!street || typeof street !== "string" || !street.trim()) {
    errors.push(`${label} street is required`);
  }

  if (!city || typeof city !== "string" || !city.trim()) {
    errors.push(`${label} city is required`);
  }

  if (!state || typeof state !== "string" || !state.trim()) {
    errors.push(`${label} state is required`);
  }

  if (!pincode || !/^[1-9][0-9]{5}$/.test(String(pincode))) {
    errors.push(`${label} pincode must be a valid 6-digit number`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      street: street?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: String(pincode),
    },
  };
};
