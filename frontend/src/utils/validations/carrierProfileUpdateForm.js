import {
  isEmpty,
  isEmailValid,
  isPhoneNumberValid,
} from "./validations";

/**
 * Validates carrier profile update form data
 * @param {Object} formData - { companyName, ownerName, email, phone, street, city, state, pincode }
 * @returns {Object} - errors object with field names as keys
 */
export const validateCarrierProfileUpdateForm = (formData) => {
  const errors = {};

  // Required fields validation
  if (isEmpty(formData.companyName)) {
    errors.companyName = "Company name is required";
  }

  if (isEmpty(formData.ownerName)) {
    errors.ownerName = "Owner name is required";
  }

  if (isEmpty(formData.email)) {
    errors.email = "Email is required";
  } else if (!isEmailValid(formData.email)) {
    errors.email = "Invalid email address";
  }

  if (isEmpty(formData.phone)) {
    errors.phone = "Phone number is required";
  } else if (!isPhoneNumberValid(formData.phone)) {
    errors.phone = "Invalid Indian phone number";
  }

  if (isEmpty(formData.street)) {
    errors.street = "Street is required";
  }

  if (isEmpty(formData.city)) {
    errors.city = "City is required";
  }

  if (isEmpty(formData.state)) {
    errors.state = "State is required";
  }

  if (isEmpty(formData.pincode)) {
    errors.pincode = "Pincode is required";
  } else {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(formData.pincode)) {
      errors.pincode = "Invalid pincode";
    }
  }

  return errors;
};
