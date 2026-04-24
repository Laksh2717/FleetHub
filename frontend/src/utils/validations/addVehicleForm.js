import { isManufacturingYearValid } from "./validations";

/**
 * Validates vehicle number format (Indian pattern)
 * @param {string} vehicleNumber - Vehicle registration number
 * @returns {boolean} - True if valid format
 */
export const isVehicleNumberValid = (vehicleNumber) => {
  if (!vehicleNumber) return false;
  // Indian vehicle number pattern: XX 00 XX 0000 or XX00XX0000
  const vehicleNumberPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i;
  return vehicleNumberPattern.test(vehicleNumber.replace(/\s/g, ""));
};

/**
 * Validates add vehicle form data
 * @param {Object} formData - { vehicleNumber, vehicleType, capacityTons, capacityLitres, manufacturingYear }
 * @returns {Object} - errors object with field names as keys
 */
export const validateAddVehicleForm = (formData) => {
  const errors = {};

  const {
    vehicleNumber,
    vehicleType,
    capacityTons,
    capacityLitres,
    manufacturingYear,
  } = formData;

  if (!vehicleNumber?.trim()) {
    errors.vehicleNumber = "Vehicle number is required";
  } else if (!isVehicleNumberValid(vehicleNumber)) {
    errors.vehicleNumber = "Invalid vehicle number format (e.g., MH 12 AB 1234)";
  }

  if (!vehicleType) {
    errors.vehicleType = "Vehicle type is required";
  }

  // Capacity validation based on vehicle type
  if (vehicleType === "TANKER") {
    if (!capacityLitres || parseFloat(capacityLitres) <= 0) {
      errors.capacityLitres = "Tanker capacity in litres must be greater than 0";
    }
  } else if (vehicleType) {
    if (!capacityTons || parseFloat(capacityTons) <= 0) {
      errors.capacityTons = "Vehicle capacity in tons must be greater than 0";
    }
  }

  if (!manufacturingYear) {
    errors.manufacturingYear = "Manufacturing year is required";
  } else if (!isManufacturingYearValid(manufacturingYear)) {
    const currentYear = new Date().getFullYear();
    errors.manufacturingYear = `Manufacturing year must be between 1900 and ${currentYear}`;
  }

  return errors;
};
