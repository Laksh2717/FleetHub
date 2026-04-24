import { isEmailValid, isGSTValid, isPasswordValid } from "./validations";

/**
 * Validates login form data
 * @param {Object} formData - { emailOrGst, password }
 * @returns {Object} - errors object with field names as keys: { emailOrGst: "error msg", password: "error msg" }
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  const { emailOrGst, password } = formData;

  // Required fields
  if (!emailOrGst?.trim()) {
    errors.emailOrGst = "Email or GST number is required";
  } else if (!isEmailValid(emailOrGst) && !isGSTValid(emailOrGst)) {
    errors.emailOrGst = "Enter a valid email or GST number";
  }

  if (!password?.trim()) {
    errors.password = "Password is required";
  } else if (!isPasswordValid(password)) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
};
