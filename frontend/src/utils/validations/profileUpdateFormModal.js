import {
  isEmpty,
  isEmailValid,
  isPhoneNumberValid,
  validateLocation,
} from "./validations";

export const validateProfileUpdateForm = (formData) => {
  const errors = {};

  if (isEmpty(formData.companyName)) {
    errors.companyName = "Company name is required";
  }

  if (isEmpty(formData.ownerName)) {
    errors.ownerName = "Owner name is required";
  }

  if (isEmpty(formData.email)) {
    errors.email = "Email is required";
  } else if (!isEmailValid(formData.email)) {
    errors.email = "Invalid email format";
  }

  if (isEmpty(formData.phone)) {
    errors.phone = "Phone number is required";
  } else if (!isPhoneNumberValid(formData.phone)) {
    errors.phone = "Invalid phone number (must be 10 digits starting with 6-9)";
  }

  // Validate location
  const locationData = {
    street: formData.street,
    city: formData.city,
    state: formData.state,
    pincode: formData.pincode,
  };

  const locationResult = validateLocation(locationData, "Address");
  if (locationResult.errors && Array.isArray(locationResult.errors) && locationResult.errors.length > 0) {
    locationResult.errors.forEach((err) => {
      const fieldMap = {
        street: "street",
        city: "city",
        state: "state",
        pincode: "pincode",
      };
      const field = Object.keys(fieldMap).find((f) => err.toLowerCase().includes(fieldMap[f]));
      if (field) {
        errors[field] = err;
      }
    });
  }

  return errors;
};
