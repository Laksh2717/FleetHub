import {
  isEmailValid,
  isPhoneNumberValid,
  isGSTValid,
  isPasswordValid,
  validateLocation,
} from "./validations";

/**
 * Validates register form data
 * @param {Object} formData - { companyName, ownerName, email, phone, gst, street, city, state, pincode, password, confirmPassword }
 * @returns {Object} - errors object with field names as keys: { email: "error msg", phone: "error msg" }
 */
export const validateRegisterForm = (formData) => {
  const errors = {};

  const {
    companyName,
    ownerName,
    email,
    phone,
    gst,
    street,
    city,
    state,
    pincode,
    password,
    confirmPassword,
  } = formData;

  // Required fields
  if (!companyName?.trim()) {
    errors.companyName = "Company name is required";
  }

  if (!ownerName?.trim()) {
    errors.ownerName = "Owner name is required";
  }

  if (!email?.trim()) {
    errors.email = "Email is required";
  } else if (!isEmailValid(email)) {
    errors.email = "Invalid email address";
  }

  if (!phone?.trim()) {
    errors.phone = "Phone number is required";
  } else if (!isPhoneNumberValid(phone)) {
    errors.phone = "Invalid Indian phone number";
  }

  if (!gst?.trim()) {
    errors.gst = "GST number is required";
  } else if (!isGSTValid(gst)) {
    errors.gst = "Invalid GST number";
  }

  if (!password?.trim()) {
    errors.password = "Password is required";
  } else if (!isPasswordValid(password)) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!confirmPassword?.trim()) {
    errors.confirmPassword = "Please confirm your password";
  } else if (password && password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  // Validate location
  const locationResult = validateLocation(
    { street, city, state, pincode },
    "Address"
  );
  if (!locationResult.isValid) {
    locationResult.errors.forEach((msg) => {
      if (msg.toLowerCase().includes("street")) errors.street = msg;
      if (msg.toLowerCase().includes("city")) errors.city = msg;
      if (msg.toLowerCase().includes("state")) errors.state = msg;
      if (msg.toLowerCase().includes("pincode")) errors.pincode = msg;
    });
  }

  return errors;
};
