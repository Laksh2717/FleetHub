/**
 * Validates place bid form data
 * @param {Object} formData - { bidAmount, estimatedTransitHours, proposedVehicleId }
 * @returns {Object} - errors object with field names as keys
 */
export const validatePlaceBidForm = (formData) => {
  const errors = {};

  if (!formData.bidAmount || formData.bidAmount.trim() === "") {
    errors.bidAmount = "Bid amount is required";
  } else if (isNaN(formData.bidAmount) || Number(formData.bidAmount) <= 0) {
    errors.bidAmount = "Bid amount must be greater than 0";
  }

  if (
    !formData.estimatedTransitHours ||
    formData.estimatedTransitHours.trim() === ""
  ) {
    errors.estimatedTransitHours = "Estimated transit hours is required";
  } else if (
    isNaN(formData.estimatedTransitHours) ||
    Number(formData.estimatedTransitHours) <= 0
  ) {
    errors.estimatedTransitHours = "Estimated transit hours must be greater than 0";
  }

  if (!formData.proposedVehicleId) {
    errors.proposedVehicleId = "Vehicle selection is required";
  }

  return errors;
};
