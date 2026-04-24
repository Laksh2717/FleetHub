import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Carrier from "../../models/carrier.model.js";
import Shipment from "../../models/shipment.model.js";
import {
  isEmpty,
  isEmailValid,
  isPhoneNumberValid,
} from "../../utils/validations.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can update carrier profile");
  }

  const carrierId = authUser._id;

  let { ownerName, companyName, email, phone, street, city, state, pincode } =
    req.body;

  const errors = [];

  const requiredFields = {
    "Owner name": ownerName,
    "Carrier name": companyName,
    Email: email,
    Phone: phone,
    Street: street,
    City: city,
    State: state,
    Pincode: pincode,
  };

  Object.entries(requiredFields).forEach(([label, value]) => {
    if (isEmpty(value)) errors.push(`${label} is required`);
  });

  if (email && !isEmailValid(email)) {
    errors.push("Invalid email address");
  }

  if (phone && !isPhoneNumberValid(phone)) {
    errors.push("Invalid phone number");
  }

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  email = email.toLowerCase();

  const carrier = await Carrier.findById(carrierId);

  if (!carrier) {
    throw new ApiError(404, "Carrier not found");
  }

  carrier.ownerName = ownerName;
  carrier.companyName = companyName;
  carrier.email = email;
  carrier.phone = phone;

  carrier.address = {
    street,
    city,
    state,
    pincode,
  };

  await carrier.save();

  const updatedCarrier = await Carrier.findById(carrierId).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { carrier: updatedCarrier },
        "Carrier profile updated successfully"
      )
    );
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can delete their account");
  }

  const carrierId = authUser._id;

  const hasActiveShipments = await Shipment.exists({
    carrierId: carrierId,
    status: { $in: ["ASSIGNED", "IN_TRANSIT", "DELIVERED"] }
  });

  if (hasActiveShipments) {
    throw new ApiError(
      400,
      "Carrier cannot be deleted if active shipments exist"
    );
  }

  await Carrier.findByIdAndDelete(carrierId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Carrier account deleted successfully"));
});

export const getProfile = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const carrier = await Carrier.findById(authUser._id).select(
    "-password -refreshToken"
  );

  if (!carrier) {
    throw new ApiError(404, "Carrier profile not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        profile: carrier,
      },
      "Carrier profile fetched successfully"
    )
  );
});