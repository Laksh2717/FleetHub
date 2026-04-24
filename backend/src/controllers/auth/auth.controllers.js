import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Shipper from "../../models/shipper.model.js";
import Carrier from "../../models/carrier.model.js";
import jwt from "jsonwebtoken";
import { expiryToMs } from "../../utils/tokenExpiry.js";
import {
  isEmpty,
  isEmailValid,
  isPhoneNumberValid,
  isGSTValid,
  isPasswordValid,
} from "../../utils/validations.js";

const generateAccessAndRefreshTokens = async (userId, role) => {
  try {
    let accessToken, refreshToken;
    if (role === "SHIPPER") {
      const shipper = await Shipper.findById(userId);

      if (!shipper) throw new ApiError(404, "User not found");

      refreshToken = shipper.generateRefreshToken();
      accessToken = shipper.generateAccessToken();
      shipper.refreshToken = refreshToken;

      await shipper.save({ validateBeforeSave: false });
    } 
    else if (role === "CARRIER") {
      const carrier = await Carrier.findById(userId);

      if (!carrier) throw new ApiError(404, "User not found");

      refreshToken = carrier.generateRefreshToken();
      accessToken = carrier.generateAccessToken();
      carrier.refreshToken = refreshToken;

      await carrier.save({ validateBeforeSave: false });
    }
    else {
      throw new ApiError(400, "Invalid role provided");
    }

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  try {
    const decodedTokenData = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const role = decodedTokenData?.role;

    if (!["SHIPPER", "CARRIER"].includes(role)) {
      throw new ApiError(401, "Invalid token role");
    }

    let user;
    if (role === "SHIPPER")
      user = await Shipper.findById(decodedTokenData?._id);
    else if (role === "CARRIER")
      user = await Carrier.findById(decodedTokenData?._id);

    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or used");

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id,
      role
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  let {
    ownerName,
    companyName,
    email,
    phone,
    password,
    street,
    city,
    state,
    pincode,
    gstNumber,
    role,
  } = req.body;

  const errors = [];

  role = role?.toUpperCase();

  let Model;
  if (role === "SHIPPER") Model = Shipper;
  else if (role === "CARRIER") Model = Carrier;
  else throw new ApiError(400, "Invalid or missing role");

  const fields = {
    "Owner name": ownerName,
    "Company name": companyName,
    "Contact email": email,
    "Contact number": phone,
    Password: password,
    Street: street,
    City: city,
    State: state,
    Pincode: pincode,
    "GST number": gstNumber,
  };

  Object.entries(fields).forEach(([label, value]) => {
    if (isEmpty(value)) errors.push(`${label} is required`);
  });

  if (!isEmailValid(email)) errors.push("Contact email is invalid");
  if (!isPhoneNumberValid(phone)) errors.push("Contact number is invalid");
  if (!isGSTValid(gstNumber)) errors.push("GST number is invalid");
  if (!isPasswordValid(password))
    errors.push("Password should be at least 6 characters");

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  const existingUser = await Model.findOne({
    $or: [{ email }, { phone }, { gstNumber }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      `${role} with this Email, Contact Number, or GST already exists`
    );
  }

  const userData = {
    ownerName,
    companyName,
    email,
    phone,
    password,
    address: { street, city, state, pincode },
    gstNumber,
  };

  const newUser = await Model.create(userData);

  const createdUser = await Model.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      { user: createdUser },
      `${role} registered successfully`
    )
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  let { emailOrGSTNumber, password, role } = req.body;

  role = role?.toUpperCase();

  let Model;
  if (role === "SHIPPER") Model = Shipper;
  else if (role === "CARRIER") Model = Carrier;
  else throw new ApiError(400, "Invalid or missing Role");

  if (!emailOrGSTNumber)
    throw new ApiError(400, "GST number or email is required");

  if (!password) throw new ApiError(400, "Password is required");

  let user;
  if (emailOrGSTNumber.includes("@")) {
    emailOrGSTNumber = emailOrGSTNumber.toLowerCase();
    user = await Model.findOne({ email: emailOrGSTNumber });
  }
  else {
    user = await Model.findOne({ gstNumber: emailOrGSTNumber });
  }

  if (!user) throw new ApiError(404, "user does not exist");

  const isCorrectPassword = await user.isPasswordCorrect(password);

  if (!isCorrectPassword) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
    role
  );

  const loggedInUser = await Model.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  
  // Convert token expiry from env to milliseconds for cookie maxAge
  const accessTokenMaxAge = expiryToMs(process.env.ACCESS_TOKEN_EXPIRY);
  const refreshTokenMaxAge = expiryToMs(process.env.REFRESH_TOKEN_EXPIRY);

  return res
    .status(200)
    .cookie("accessToken", accessToken, { ...options, maxAge: accessTokenMaxAge })
    .cookie("refreshToken", refreshToken, { ...options, maxAge: refreshTokenMaxAge })
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken, user: loggedInUser },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (!user) throw new ApiError(401, "Unauthorized request");

  let Model;
  if (user.role === "SHIPPER") Model = Shipper;
  else if (user.role === "CARRIER") Model = Carrier;
  else throw new ApiError(401, "Invalid user role");

  await Model.findByIdAndUpdate(
    user._id,
    { $set: { refreshToken: null } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (!user) throw new ApiError(401, "Unauthorized request");

  let Model;
  if (user.role === "SHIPPER") Model = Shipper;
  else if (user.role === "CARRIER") Model = Carrier;
  else throw new ApiError(401, "Invalid user role");

  const currentUser = await Model.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!currentUser)
    throw new ApiError(404, "User not found");

  // Include role in the response
  const userWithRole = {
    ...currentUser.toObject(),
    role: user.role,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: userWithRole },
      "User fetched successfully"
    )
  );
});
