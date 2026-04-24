import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Shipper from "../../models/shipper.model.js";
import Shipment from "../../models/shipment.model.js";
import {
  isEmpty,
  isEmailValid,
  isPhoneNumberValid,
} from "../../utils/validations.js";

export const getProfile = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access this resource");
  }

  const shipper = await Shipper.findById(authUser._id).select(
    "-password -refreshToken"
  );

  if (!shipper) {
    throw new ApiError(404, "Shipper profile not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        profile: shipper,
      },
      "Shipper profile fetched successfully"
    )
  );
});

export const getAddress = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access this resource");
  }

  const shipper = await Shipper.findById(authUser._id).select("address");

  if (!shipper) {
    throw new ApiError(404, "Shipper not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        address: shipper.address,
      },
      "Shipper address fetched successfully"
    )
  );
});

export const updateProfile = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can update profile");
  }

  const shipperId = authUser._id;

  let { ownerName, companyName, email, phone, street, city, state, pincode } =
    req.body;

  const errors = [];

  const requiredFields = {
    "Owner name": ownerName,
    "Company name": companyName,
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

  const shipper = await Shipper.findById(shipperId);

  if (!shipper) {
    throw new ApiError(404, "Shipper not found");
  }

  shipper.ownerName = ownerName;
  shipper.companyName = companyName;
  shipper.email = email;
  shipper.phone = phone;

  shipper.address = {
    street,
    city,
    state,
    pincode,
  };

  await shipper.save();

  const updatedShipper = await Shipper.findById(shipperId).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { shipper: updatedShipper },
        "Shipper profile updated successfully"
      )
    );
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can delete their account");
  }

  const shipperId = authUser._id;

  const shipper = await Shipper.findById(shipperId);
  if (!shipper) throw new ApiError(404, "Shipper not found");

  const hasActiveShipments = await Shipment.exists({
    shipperId,
    status: {$in : ["ASSIGNED", "IN_TRANSIT", "DELIVERED"]},
  });

  if (hasActiveShipments) {
    throw new ApiError(
      400,
      "Shipper cannot be deleted while active shipments exist"
    );
  }

  await Shipper.findByIdAndDelete(shipperId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Shipper account deleted successfully"));
});