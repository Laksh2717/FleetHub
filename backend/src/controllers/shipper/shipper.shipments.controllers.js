import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Shipment from "../../models/shipment.model.js";
import Bid from "../../models/bid.model.js";
import Carrier from "../../models/carrier.model.js";
import Payment from "../../models/payment.model.js";
import Rating from "../../models/rating.model.js";
import Vehicle from "../../models/vehicle.model.js";
import Shipper from "../../models/shipper.model.js";
import redis from "../../config/redis.config.js";
import { sendNotification } from "../notification/notification.controllers.js";
import { NOTIF_TYPES } from "../../constants/notificationTypes.js";
import mongoose from "mongoose";
import {
  isEmpty,
  validateShipmentDates,
  validateLocation,
} from "../../utils/validations.js";

export const getUnassignedShipments = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access this resource");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const { tab } = req.query;
  const now = new Date();

  // ========== TAB VALIDATION ==========
  if (!tab || !["open", "expired"].includes(tab)) {
    throw new ApiError(
      400,
      "Invalid tab. Allowed values: open, expired"
    );
  }

  // ========== MATCH CONDITION ==========
  const matchStage =
    tab === "open"
      ? {
          shipperId,
          status: "CREATED",
          expiresAt: { $gt: now },
        }
      : {
          shipperId,
          status: "EXPIRED",
          expiresAt: { $lte: now },
        };

  // ========== AGGREGATION ==========
  const shipments = await Shipment.aggregate([
    // 1️⃣ Match by tab
    { $match: matchStage },

    // 2️⃣ Lookup bids (for totalBids)
    {
      $lookup: {
        from: "bids",
        localField: "_id",
        foreignField: "shipmentId",
        as: "bids",
      },
    },

    // 3️⃣ Shape card-level data (EXACT match with getters)
    {
      $project: {
        // --- Receiver ---
        receiverCompanyName: 1,
        shipmentRef: 1,
        status: 1,

        // --- Route ---
        pickupCity: "$pickupLocation.city",
        deliveryCity: "$deliveryLocation.city",

        // --- Load ---
        product: 1,
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Pricing ---
        budgetPrice: 1,

        // --- Timeline ---
        biddingDeadline: 1,
        pickupDate: 1,
        estimatedDeliveryDate: 1,
        expiresAt: 1,

        // --- Bids ---
        totalBids: { $size: "$bids" },
      },
    },

    // 4️⃣ Sorting (same as getters)
    {
      $sort:
        tab === "open"
          ? { biddingDeadline: 1 }
          : { expiresAt: -1 },
    },
  ]);

  if (!shipments || shipments.length === 0) {
    return res.status(200).json(new ApiResponse(200, {count: 0, shipments: []}, "No shipments found"))
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: shipments.length,
        shipments,
      },
      `${
        tab === "open" ? "Open" : "Expired"
      } created shipments fetched successfully`
    )
  );
});

export const getActiveShipments = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access this resource");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const { tab } = req.query;

  // ========== TAB VALIDATION ==========
  if (!tab || !["assigned", "in-transit"].includes(tab)) {
    throw new ApiError(
      400,
      "Invalid tab. Allowed values: assigned, in-transit"
    );
  }

  const status = tab === "assigned" ? "ASSIGNED" : "IN_TRANSIT";

  // Get counts for both tabs
  const [assignedCount, inTransitCount] = await Promise.all([
    Shipment.countDocuments({ shipperId, status: "ASSIGNED" }),
    Shipment.countDocuments({ shipperId, status: "IN_TRANSIT" })
  ]);

  // ========== BASE PROJECT (COMMON FIELDS) ==========
  const baseProject = {
    // --- Parties ---
    carrierCompanyName: "$carrier.companyName",
    receiverCompanyName: 1,
    shipmentRef: 1,

    // --- Route ---
    pickupCity: "$pickupLocation.city",
    deliveryCity: "$deliveryLocation.city",

    // --- Product ---
    product: 1,

    // --- Pricing ---
    budgetPrice: 1,
    bidAmount: "$acceptedBid.bidAmount",

    // --- Transit ---
    estimatedTransitHours: "$acceptedBid.estimatedTransitHours",

    // --- Vehicle ---
    vehicleNumber: "$vehicle.vehicleNumber",
    vehicleType: "$vehicle.vehicleType",

    // --- Load ---
    totalWeightTons: 1,
    totalVolumeLitres: 1,
  };

  // ========== TAB-SPECIFIC EXTENSION ==========
  const projectStage =
    tab === "assigned"
      ? {
          ...baseProject,
          pickupDate: 1,
          estimatedDeliveryDate: 1,
        }
      : {
          ...baseProject,
          pickupConfirmedAt: 1,
        };

  // ========== AGGREGATION ==========
  const shipments = await Shipment.aggregate([
    // 1️⃣ Match
    {
      $match: {
        shipperId,
        status,
      },
    },

    // 2️⃣ Join carrier
    {
      $lookup: {
        from: "carriers",
        localField: "carrierId",
        foreignField: "_id",
        as: "carrier",
      },
    },
    { $unwind: "$carrier" },

    // 3️⃣ Join accepted bid
    {
      $lookup: {
        from: "bids",
        let: { shipmentId: "$_id", carrierId: "$carrierId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$shipmentId", "$$shipmentId"] },
                  { $eq: ["$carrierId", "$$carrierId"] },
                  { $eq: ["$status", "ACCEPTED"] },
                ],
              },
            },
          },
        ],
        as: "acceptedBid",
      },
    },
    { $unwind: "$acceptedBid" },

    // 4️⃣ Join vehicle
    {
      $lookup: {
        from: "vehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },

    // 5️⃣ Project (BASE + EXTENSION)
    {
      $project: projectStage,
    },

    // 6️⃣ Sort
    {
      $sort:
        tab === "assigned"
          ? { pickupDate: 1 }
          : { pickupConfirmedAt: -1 },
    },
  ]);

  if (!shipments || shipments.length === 0) 
    return res.status(200).json(new ApiResponse(200, {counts: {assigned: 0, inTransit: 0}, shipments: []}, "No shipments found"))

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shipments,
        counts: {
          assigned: assignedCount,
          inTransit: inTransitCount
        }
      },
      "Active shipments fetched successfully"
    )
  );
});

export const getPendingPaymentShipments = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ---------- AUTH ----------
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access pending payments");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);

  // ---------- AGGREGATION ----------
  const shipments = await Shipment.aggregate([
    // 1️⃣ Delivered but payment pending
    {
      $match: {
        shipperId,
        status: "DELIVERED",
        paymentStatus: "PENDING",
      },
    },

    // 2️⃣ Accepted bid (commercial terms)
    {
      $lookup: {
        from: "bids",
        let: { shipmentId: "$_id", carrierId: "$carrierId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$shipmentId", "$$shipmentId"] },
                  { $eq: ["$carrierId", "$$carrierId"] },
                  { $eq: ["$status", "ACCEPTED"] },
                ],
              },
            },
          },
        ],
        as: "acceptedBid",
      },
    },
    { $unwind: "$acceptedBid" },

    // 3️⃣ Carrier
    {
      $lookup: {
        from: "carriers",
        localField: "carrierId",
        foreignField: "_id",
        as: "carrier",
      },
    },
    { $unwind: "$carrier" },

    {
      $lookup: {
        from: "vehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },

    // 4️⃣ Card projection
    {
      $project: {
        // Shipment
        shipmentRef: 1,
        receiverCompanyName: 1,
        product: 1,
        pickupCity: "$pickupLocation.city",
        deliveryCity: "$deliveryLocation.city",
        totalWeightTons: 1,
        totalVolumeLitres: 1,
        budgetPrice: 1,
        pickupConfirmedAt: 1,
        deliveredAt: 1,

        // Carrier
        carrierCompanyName: "$carrier.companyName",

        // Bid
        bidAmount: "$acceptedBid.bidAmount",

        // Vehicle
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
      },
    },

    // 6️⃣ Most recently delivered first
    {
      $sort: { deliveredAt: -1 },
    },
  ]);

  if (!shipments || shipments.length === 0) {
    return res.status(200).json(new ApiResponse(200, {count: 0, shipments: []}, "No shipments found"))
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: shipments.length,
        shipments,
      },
      "Pending payment shipments fetched successfully"
    )
  );
});

export const getShipmentHistory = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ---------- AUTH ----------
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access completed shipments");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);

  // ---------- AGGREGATION ----------
  const shipments = await Shipment.aggregate([
    // 1️⃣ Delivered & payment completed
    {
      $match: {
        shipperId,
        status: "DELIVERED",
        paymentStatus: "COMPLETED",
      },
    },

    // 2️⃣ Accepted bid
    {
      $lookup: {
        from: "bids",
        let: { shipmentId: "$_id", carrierId: "$carrierId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$shipmentId", "$$shipmentId"] },
                  { $eq: ["$carrierId", "$$carrierId"] },
                  { $eq: ["$status", "ACCEPTED"] },
                ],
              },
            },
          },
        ],
        as: "acceptedBid",
      },
    },
    { $unwind: "$acceptedBid" },

    // 3️⃣ Carrier
    {
      $lookup: {
        from: "carriers",
        localField: "carrierId",
        foreignField: "_id",
        as: "carrier",
      },
    },
    { $unwind: "$carrier" },

    // 4️⃣ Vehicle
    {
      $lookup: {
        from: "vehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },

    // 5️⃣ Payment (to get paidAt)
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "shipmentId",
        as: "payment",
      },
    },
    { $unwind: "$payment" },

    // 6️⃣ Rating (LEFT JOIN – optional, with ObjectId type safety)
    {
      $lookup: {
        from: "ratings",
        let: { shipmentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$shipmentId", "$$shipmentId"]
              }
            }
          }
        ],
        as: "rating",
      },
    },

    // 7️⃣ Card projection
    {
      $project: {
        // ---------- Shipment ----------
        shipmentRef: 1,
        receiverCompanyName: 1,
        product: 1,
        pickupCity: "$pickupLocation.city",
        deliveryCity: "$deliveryLocation.city",
        totalWeightTons: 1,
        totalVolumeLitres: 1,
        budgetPrice: 1,
        deliveredAt: 1,

        // ---------- Carrier ----------
        carrierCompanyName: "$carrier.companyName",

        // ---------- Vehicle ----------
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        capacityTons: "$vehicle.capacityTons",
        capacityLitres: "$vehicle.capacityLitres",

        // ---------- Bid ----------
        bidAmount: "$acceptedBid.bidAmount",

        // ---------- Payment ----------
        paidAt: "$payment.paidAt",

        // ---------- Rating (card control) ----------
        isRated: 1,
        ratingValue: {
          $cond: [
            { $eq: ["$isRated", true] },
            { $arrayElemAt: ["$rating.rating", 0] },
            null,
          ],
        },
      },
    },

    // 8️⃣ Latest completed first
    {
      $sort: { paidAt: -1 },
    },
  ]);

  if (!shipments || shipments.length === 0){
    return res.status(200).json(new ApiResponse(200, {count: 0, shipments: []}, "No shipments found"))
  }

  // Debug: Log the first few shipments and their rating fields
  console.log("[DEBUG] Shipments with ratings:");
  shipments.slice(0, 5).forEach((s, i) => {
    console.log(`Shipment #${i+1}: _id=${s._id}, isRated=${s.isRated}, ratingValue=${s.ratingValue}, rating=`, s.rating);
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: shipments.length,
        shipments,
      },
      "Completed shipments fetched successfully"
    )
  );
});

export const getPendingPaymentShipmentDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ---------- AUTH ----------
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access pending payment details");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const shipperId = authUser._id;

  // ---------- SHIPMENT ----------
  const shipment = await Shipment.findOne({
    _id: shipmentId,
    shipperId,
    status: "DELIVERED",
    paymentStatus: "PENDING",
  });

  if (!shipment) {
    throw new ApiError(
      404,
      "Pending payment shipment not found or not accessible"
    );
  }

  // ---------- ACCEPTED BID ----------
  const acceptedBid = await Bid.findOne({
    shipmentId: shipment._id,
    carrierId: shipment.carrierId,
    status: "ACCEPTED",
  });

  if (!acceptedBid) {
    throw new ApiError(500, "Accepted bid not found for shipment");
  }

  // ---------- RELATED ENTITIES ----------
  const shipper = await Shipper.findById(shipment.shipperId);
  const carrier = await Carrier.findById(shipment.carrierId);
  const vehicle = await Vehicle.findById(shipment.vehicleId);

  if (!shipper || !carrier || !vehicle) {
    throw new ApiError(500, "Related entity not found");
  }

  // ---------- TRANSIT CALCULATION ----------
  let actualTransitHours = null;

  if (shipment.pickupConfirmedAt && shipment.deliveredAt) {
    const diffMs =
      new Date(shipment.deliveredAt) -
      new Date(shipment.pickupConfirmedAt);

    actualTransitHours = Math.round(diffMs / (1000 * 60 * 60));
  }

  // ---------- RESPONSE ----------
  const responseData = {
    // Shipment
    shipmentRef: shipment.shipmentRef,
    shipperCompanyName: shipper.companyName,
    receiverCompanyName: shipment.receiverCompanyName,
    product: shipment.product,
    description: shipment.description,
    budgetPrice: shipment.budgetPrice,
    totalWeightTons: shipment.totalWeightTons,
    totalVolumeLitres: shipment.totalVolumeLitres,
    pickupLocation: shipment.pickupLocation,
    deliveryLocation: shipment.deliveryLocation,
    pickupDate: shipment.pickupDate,                       // planned
    estimatedDeliveryDate: shipment.estimatedDeliveryDate, // planned
    pickupConfirmedAt: shipment.pickupConfirmedAt,         // actual
    deliveredAt: shipment.deliveredAt,                     // actual

    // Transit
    estimatedTransitHours: acceptedBid.estimatedTransitHours,
    actualTransitHours,

    // Bid
    bidAmount: acceptedBid.bidAmount,

    // Carrier
    carrierCompanyName: carrier.companyName,
    carrierOwnerName: carrier.ownerName,
    carrierEmail: carrier.email,
    carrierPhone: carrier.phone,
    carrierGstNumber: carrier.gstNumber,
    carrierAddress: carrier.address,
    carrierAverageRating: carrier.averageRating,
    carrierRatingCount: carrier.ratingCount,
    carrierFleetSize: carrier.fleetSize,

    // Vehicle
    vehicleNumber: vehicle.vehicleNumber,
    vehicleType: vehicle.vehicleType,
    capacityTons: vehicle.capacityTons,
    capacityLitres: vehicle.capacityLitres,
    manufacturingYear: vehicle.manufacturingYear,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipment: responseData },
      "Pending payment shipment details fetched successfully"
    )
  );
});

export const getShipmentHistoryDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ---------- AUTH ----------
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access completed shipment details");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const shipperId = authUser._id;

  // ---------- SHIPMENT ----------
  const shipment = await Shipment.findOne({
    _id: shipmentId,
    shipperId,
    status: "DELIVERED",
    paymentStatus: "COMPLETED",
  });

  if (!shipment) {
    throw new ApiError(
      404,
      "Completed shipment not found or not accessible"
    );
  }

  // ---------- ACCEPTED BID ----------
  const acceptedBid = await Bid.findOne({
    shipmentId: shipment._id,
    carrierId: shipment.carrierId,
    status: "ACCEPTED",
  });

  if (!acceptedBid) {
    throw new ApiError(500, "Accepted bid not found for shipment");
  }

  // ---------- PAYMENT ----------
  const payment = await Payment.findOne({
    shipmentId: shipment._id,
    status: "COMPLETED",
  });

  if (!payment) {
    throw new ApiError(500, "Completed payment record not found");
  }

  // ---------- RATING (OPTIONAL) ----------
  const rating = await Rating.findOne({
    shipmentId: shipment._id,
    raterShipperId: shipperId,
  });

  // ---------- RELATED ENTITIES ----------
  const shipper = await Shipper.findById(shipment.shipperId);
  const carrier = await Carrier.findById(shipment.carrierId);
  const vehicle = await Vehicle.findById(shipment.vehicleId);

  if (!shipper || !carrier || !vehicle) {
    throw new ApiError(500, "Related entity not found");
  }

  // ---------- TRANSIT CALCULATION ----------
  let actualTransitHours = null;

  if (shipment.pickupConfirmedAt && shipment.deliveredAt) {
    const diffMs =
      new Date(shipment.deliveredAt) -
      new Date(shipment.pickupConfirmedAt);

    actualTransitHours = Math.round(diffMs / (1000 * 60 * 60));
  }

  // ---------- RESPONSE ----------
  const responseData = {
    // Shipment
    shipmentRef: shipment.shipmentRef,
    shipperCompanyName: shipper.companyName,
    receiverCompanyName: shipment.receiverCompanyName,
    product: shipment.product,
    description: shipment.description,
    budgetPrice: shipment.budgetPrice,
    totalWeightTons: shipment.totalWeightTons,
    totalVolumeLitres: shipment.totalVolumeLitres,
    pickupLocation: shipment.pickupLocation,
    deliveryLocation: shipment.deliveryLocation,
    pickupDate: shipment.pickupDate,                       // planned
    estimatedDeliveryDate: shipment.estimatedDeliveryDate, // planned
    pickupConfirmedAt: shipment.pickupConfirmedAt,         // actual
    deliveredAt: shipment.deliveredAt,                     // actual

    // Transit
    estimatedTransitHours: acceptedBid.estimatedTransitHours,
    actualTransitHours,

    // Payment
    paidAt: payment.paidAt,

    // Bid
    bidAmount: acceptedBid.bidAmount,

    // Carrier
    carrierCompanyName: carrier.companyName,
    carrierOwnerName: carrier.ownerName,
    carrierEmail: carrier.email,
    carrierPhone: carrier.phone,
    carrierGstNumber: carrier.gstNumber,
    carrierAddress: carrier.address,
    carrierAverageRating: carrier.averageRating,
    carrierRatingCount: carrier.ratingCount,
    carrierFleetSize: carrier.fleetSize,

    // Vehicle
    vehicleNumber: vehicle.vehicleNumber,
    vehicleType: vehicle.vehicleType,
    capacityTons: vehicle.capacityTons,
    capacityLitres: vehicle.capacityLitres,
    manufacturingYear: vehicle.manufacturingYear,

    // Rating (read-only)
    isRated: shipment.isRated,
    ratingValue: shipment.isRated && rating ? rating.rating : null,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipment: responseData },
      "Completed shipment details fetched successfully"
    )
  );
});

export const getUnassignedShipmentDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access this resource");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const shipmentObjectId = new mongoose.Types.ObjectId(shipmentId);

  // ========== AGGREGATION ==========
  const result = await Shipment.aggregate([
    // 1️⃣ Match shipment of this shipper (CREATED or EXPIRED status)
    {
      $match: {
        _id: shipmentObjectId,
        shipperId,
        status: { $in: ["CREATED", "EXPIRED"] },
      },
    },

    // 2️⃣ Join shipper (for company name consistency)
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

    // 3️⃣ Lookup bids (for total count)
    {
      $lookup: {
        from: "bids",
        localField: "_id",
        foreignField: "shipmentId",
        as: "bids",
      },
    },

    // 4️⃣ Shape details page data
    {
      $project: {
        // --- Status (to determine open/expired) ---
        status: 1,
        
        // --- Parties ---
        shipperCompanyName: "$shipper.companyName",
        receiverCompanyName: 1,

        // --- Identity ---
        shipmentRef: 1,

        // --- Product & description ---
        product: 1,
        description: 1,

        // --- Pricing ---
        budgetPrice: 1,

        // --- Vehicle requirement ---
        requiredVehicleTypes: 1,

        // --- Load ---
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Locations ---
        pickupLocation: 1,
        deliveryLocation: 1,

        // --- Timeline ---
        biddingDeadline: 1,
        expiresAt: 1,
        pickupDate: 1,
        estimatedDeliveryDate: 1,

        // --- Bids ---
        totalBids: { $size: "$bids" },
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(
      404,
      "Shipment not found or not accessible"
    );
  }

  const shipment = result[0];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shipment,
      },
      "Shipment details fetched successfully"
    )
  );
});

export const getActiveShipmentDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access this resource");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const shipmentObjectId = new mongoose.Types.ObjectId(shipmentId);

  // ========== FETCH SHIPMENT ==========
  const shipment = await Shipment.findOne({
    _id: shipmentObjectId,
    shipperId,
    status: { $in: ["ASSIGNED", "IN_TRANSIT"] },
  });

  if (!shipment) {
    throw new ApiError(
      404,
      "Active shipment not found or not accessible"
    );
  }

  // ========== ACCEPTED BID ==========
  const acceptedBid = await Bid.findOne({
    shipmentId: shipment._id,
    carrierId: shipment.carrierId,
    status: "ACCEPTED",
  });

  if (!acceptedBid) {
    throw new ApiError(500, "Accepted bid not found for shipment");
  }

  // ========== RELATED ENTITIES ==========
  const shipper = await Shipper.findById(shipment.shipperId);
  const carrier = await Carrier.findById(shipment.carrierId);
  const vehicle = await Vehicle.findById(shipment.vehicleId);

  if (!shipper || !carrier || !vehicle) {
    throw new ApiError(500, "Related entity not found");
  }

  // ========== BASE RESPONSE (COMMON FIELDS) ==========
  const responseData = {
    // ---------- Shipment ----------
    shipmentRef: shipment.shipmentRef,
    shipperCompanyName: shipper.companyName,
    receiverCompanyName: shipment.receiverCompanyName,
    product: shipment.product,
    description: shipment.description,
    budgetPrice: shipment.budgetPrice,
    totalWeightTons: shipment.totalWeightTons,
    totalVolumeLitres: shipment.totalVolumeLitres,
    pickupLocation: shipment.pickupLocation,
    deliveryLocation: shipment.deliveryLocation,
    pickupDate: shipment.pickupDate,
    estimatedDeliveryDate: shipment.estimatedDeliveryDate,

    // ---------- Accepted Bid ----------
    bidAmount: acceptedBid.bidAmount,
    estimatedTransitHours: acceptedBid.estimatedTransitHours,

    // ---------- Carrier ----------
    carrierCompanyName: carrier.companyName,
    carrierOwnerName: carrier.ownerName,
    carrierEmail: carrier.email,
    carrierPhone: carrier.phone,
    carrierGstNumber: carrier.gstNumber,
    carrierAddress: carrier.address,
    carrierAverageRating: carrier.averageRating,
    carrierRatingCount: carrier.ratingCount,
    carrierFleetSize: carrier.fleetSize,

    // ---------- Vehicle ----------
    vehicleNumber: vehicle.vehicleNumber,
    vehicleType: vehicle.vehicleType,
    capacityTons: vehicle.capacityTons,
    capacityLitres: vehicle.capacityLitres,
    manufacturingYear: vehicle.manufacturingYear,
  };

  // ========== IN-TRANSIT EXTENSION ==========
  if (shipment.status === "IN_TRANSIT") {
    responseData.pickupConfirmedAt = shipment.pickupConfirmedAt;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipment: responseData },
      "Active shipment details fetched successfully"
    )
  );
});

export const createShipment = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can create loads");
  }

  const shipperId = authUser._id;

  let {
    receiverCompanyName,
    budgetPrice,
    requiredVehicleTypes,
    biddingDeadline,
    pickupDate,
    estimatedDeliveryDate,
    totalWeightTons,
    totalVolumeLitres,
    pickupLocation,
    deliveryLocation,
    product,
    description,
  } = req.body;

  const errors = [];

  const requiredFields = {
    receiverCompanyName,
    budgetPrice,
    requiredVehicleTypes,
    biddingDeadline,
    pickupDate,
    estimatedDeliveryDate,
    pickupLocation,
    deliveryLocation,
    product,
  };

  Object.entries(requiredFields).forEach(([key, value]) => {
    if (isEmpty(value)) errors.push(`${key} is required`);
  });

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  budgetPrice = Number(budgetPrice);
  totalWeightTons = Number(totalWeightTons || 0);
  totalVolumeLitres = Number(totalVolumeLitres || 0);

  if (isNaN(budgetPrice) || budgetPrice <= 0) {
    errors.push("Budget price must be greater than 0");
  }

  if (isEmpty(receiverCompanyName)) {
    errors.push("receiverCompanyName is required");
  } else {
    const shipper = await Shipper.findById(shipperId).select("companyName");
    if (shipper && shipper.companyName === receiverCompanyName) {
      errors.push("Shipper and receiver cannot be the same company");
    }
  }

  const ALLOWED_VEHICLE_TYPES = [
    "TRAILER_FLATBED",
    "OPEN_BODY",
    "CLOSED_CONTAINER",
    "TANKER",
    "REFRIGERATED",
    "LCV",
  ];

  if (
    !Array.isArray(requiredVehicleTypes) ||
    requiredVehicleTypes.length === 0
  ) {
    errors.push("requiredVehicleTypes must be a non-empty array");
  } else {
    requiredVehicleTypes = requiredVehicleTypes.map((v) => v.toUpperCase());

    const invalidType = requiredVehicleTypes.find(
      (v) => !ALLOWED_VEHICLE_TYPES.includes(v)
    );

    if (invalidType) {
      errors.push(`Invalid vehicle type: ${invalidType}`);
    }

    const hasTanker = requiredVehicleTypes.includes("TANKER");

    if (hasTanker && requiredVehicleTypes.length > 1) {
      errors.push("TANKER cannot be combined with other vehicle types");
    }

    if (hasTanker) {
      totalWeightTons = 0;

      if (isNaN(totalVolumeLitres) || totalVolumeLitres <= 0) {
        errors.push("For TANKER, totalVolumeLitres must be greater than 0");
      }
    } else {
      totalVolumeLitres = 0;

      if (isNaN(totalWeightTons) || totalWeightTons <= 0) {
        errors.push("totalWeightTons must be greater than 0");
      }
    }
  }

  const dateValidation = validateShipmentDates({
    biddingDeadline,
    pickupDate,
    estimatedDeliveryDate,
  });

  if (!dateValidation.isValid) {
    Object.values(dateValidation.errors).forEach((e) => errors.push(e));
  }

  const pickupLoc = validateLocation(pickupLocation, "Pickup location");
  if (!pickupLoc.isValid) errors.push(...pickupLoc.errors);

  const deliveryLoc = validateLocation(deliveryLocation, "Delivery location");
  if (!deliveryLoc.isValid) errors.push(...deliveryLoc.errors);

  if (isEmpty(product)) {
    errors.push("Product is required");
  }

  product = product?.trim();
  description = description?.trim();

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  const shipmentRef = `S-${Date.now()}`;

  const expiresAt = new Date(
    dateValidation.data.biddingDeadline.getTime() + 48 * 60 * 60 * 1000
  );

  const shipment = await Shipment.create({
    shipmentRef,
    shipperId,
    receiverCompanyName,
    budgetPrice,
    requiredVehicleTypes,
    biddingDeadline: dateValidation.data.biddingDeadline,
    pickupDate: dateValidation.data.pickupDate,
    estimatedDeliveryDate: dateValidation.data.estimatedDeliveryDate,
    totalWeightTons,
    totalVolumeLitres,
    pickupLocation: pickupLoc.data,
    deliveryLocation: deliveryLoc.data,
    product,
    description,
    expiresAt,
  });

  if (!shipment) {
    throw new ApiError(500, "Failed to create shipment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { shipment }, "Shipment created successfully"));
});

export const acceptBid = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can accept bids");
  }

  const shipperId = authUser._id;
  const { bidId } = req.body;

  if (!bidId || !mongoose.Types.ObjectId.isValid(bidId)) {
    throw new ApiError(400, "Invalid bidId");
  }

  const session = await mongoose.startSession();

  let transactionCommitted = false;

  try {
    session.startTransaction();

    const bid = await Bid.findById(bidId).session(session);
    if (!bid || bid.status !== "PENDING") {
      console.log(`[Bid Acceptance] Bid ${bidId} not available. Bid:`, bid);
      throw new ApiError(400, "Bid not available for acceptance");
    }

    const shipment = await Shipment.findOne({
      _id: bid.shipmentId,
      shipperId,
      status: "CREATED",
    }).session(session);

    if (!shipment) {
      console.log(`[Bid Acceptance] Shipment not available for bid ${bidId}. Shipment:`, shipment);
      throw new ApiError(404, "Shipment not available for assignment");
    }
    const now = new Date();

    if (now < shipment.biddingDeadline) {
      throw new ApiError(400, "Cannot accept bid before bidding deadline");
    }

    if (now > shipment.expiresAt) {
      throw new ApiError(400, "Cannot accept bid after shipment expiration");
    }

    // shipment is the merged document; no separate shipment creation needed

    /* ---------- CHECK FOR EXISTING ACCEPTED BID ---------- */
    const existingAcceptedBid = await Bid.findOne({
      shipmentId: shipment._id,
      status: "ACCEPTED",
    }).session(session);

    if (existingAcceptedBid) {
      console.log(`[Bid Acceptance] Shipment ${shipment._id} already has accepted bid ${existingAcceptedBid._id}`);
      throw new ApiError(400, "Shipment already assigned to another carrier");
    }

    /* ---------- ACCEPT BID & ASSIGN SHIPMENT ---------- */
    bid.status = "ACCEPTED";
    bid.statusChangedOn = new Date();
    await bid.save({ session });

    /* ---------- VERIFY VEHICLE ---------- */
    const vehicle = await Vehicle.findById(bid.proposedVehicleId).session(
      session
    );
    if (!vehicle || vehicle.status !== "BIDDED") {
      throw new ApiError(409, "Vehicle not available");
    }

    await Vehicle.findByIdAndUpdate(
      vehicle._id,
      { status: "ASSIGNED" },
      { session }
    );

    // assign carrier and vehicle to the existing shipment
    shipment.status = "ASSIGNED";
    shipment.carrierId = bid.carrierId;
    shipment.vehicleId = vehicle._id;
    await shipment.save({ session });

    /* ---------- REJECT OTHER BIDS ---------- */
    const otherBids = await Bid.find({
      shipmentId: shipment._id,
      _id: { $ne: bid._id },
      status: "PENDING",
    }).session(session);

    for (const otherBid of otherBids) {
      otherBid.status = "REJECTED";
      otherBid.statusChangedOn = new Date();
      await otherBid.save({ session });

      await Vehicle.findByIdAndUpdate(
        otherBid.proposedVehicleId,
        { status: "AVAILABLE" },
        { session }
      );
    }

    await session.commitTransaction();
    transactionCommitted = true;
    session.endSession();

    // Send notifications AFTER transaction is committed
    await sendNotification({
      userId: bid.carrierId.toString(),
      type: NOTIF_TYPES.BID_ACCEPTED,
      message: `Your bid has been accepted for shipment ${shipment.shipmentRef}. Get ready for pickup!`,
      shipmentId: shipment._id.toString(),
      metadata: {
        bidId: bid._id.toString(),
        bidAmount: bid.bidAmount,
        shipmentRef: shipment.shipmentRef,
        pickupDate: shipment.pickupDate,
      },
    });

    await Promise.all(
      otherBids.map((otherBid) =>
        sendNotification({
          userId: otherBid.carrierId.toString(),
          type: NOTIF_TYPES.BID_REJECTED,
          message: `Your bid for shipment ${shipment.shipmentRef} was not selected.`,
          shipmentId: shipment._id.toString(),
          metadata: {
            bidId: otherBid._id.toString(),
            shipmentRef: shipment.shipmentRef,
          },
        })
      )
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { bid, shipment },
          "Bid accepted and shipment created successfully"
        )
      );
  } catch (err) {
    // Only abort if transaction hasn't been committed yet
    if (!transactionCommitted) {
      await session.abortTransaction();
    }
    session.endSession();
    throw err;
  }
});

export const rateCarrier = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTHORIZATION ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can rate carriers");
  }

  const shipperId = authUser._id;
  const { shipmentId } = req.params;
  let { rating } = req.body;

  // ========== VALIDATION ==========
  const errors = [];

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    errors.push("Invalid shipmentId");
  }

  rating = Number(rating);
  if (
    !rating ||
    isNaN(rating) ||
    rating < 1 ||
    rating > 5 ||
    !Number.isInteger(rating)
  ) {
    errors.push("Rating must be an integer between 1 and 5");
  }

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  // ========== FETCH SHIPMENT ==========
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new ApiError(404, "Shipment not found");
  }

  // Only shipment owner (shipper) can rate
  if (shipment.shipperId.toString() !== shipperId.toString()) {
    throw new ApiError(403, "You are not authorized to rate this shipment");
  }

  // Shipment must be delivered
  if (shipment.status !== "DELIVERED") {
    throw new ApiError(400, "Rating is allowed only for delivered shipments");
  }

  // Prevent duplicate rating (FAST CHECK)
  if (shipment.isRated === true) {
    throw new ApiError(
      409,
      "This shipment has already been rated"
    );
  }

  // ========== TRANSACTION ==========
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create Rating
    const [newRating] = await Rating.create(
      [
        {
          shipmentId,
          raterShipperId: shipperId,
          ratedCarrierId: shipment.carrierId,
          rating,
        },
      ],
      { session }
    );

    if (!newRating) {
      throw new ApiError(500, "Failed to create rating");
    }

    // Update Carrier stats
    const carrier = await Carrier.findById(shipment.carrierId).session(session);

    if (!carrier) {
      throw new ApiError(404, "Carrier not found");
    }

    const currentAverage = carrier.averageRating || 0;
    const currentCount = carrier.ratingCount || 0;

    const newCount = currentCount + 1;
    const newAverage =
      (currentAverage * currentCount + rating) / newCount;

    carrier.averageRating = Math.round(newAverage * 100) / 100;
    carrier.ratingCount = newCount;

    await carrier.save({ session });

    // ✅ Update shipment helper flag
    shipment.isRated = true;
    await shipment.save({ session });

    await session.commitTransaction();
    session.endSession();

    await sendNotification({
      userId: shipment.carrierId.toString(),
      type: NOTIF_TYPES.RATING_RECEIVED,
      message: `You received a ${rating}-star rating for shipment ${shipment.shipmentRef}.`,
      shipmentId: shipment._id.toString(),
      metadata: {
        rating,
        ratingId: newRating._id.toString(),
        newAverageRating: carrier.averageRating,
        ratingCount: carrier.ratingCount,
      },
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          rating: {
            _id: newRating._id,
            shipmentId: newRating.shipmentId,
            rating: newRating.rating,
          },
          carrierStats: {
            averageRating: carrier.averageRating,
            ratingCount: carrier.ratingCount,
          },
        },
        "Carrier rated successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const getOpenShipmentBids = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access bids");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const shipmentObjectId = new mongoose.Types.ObjectId(shipmentId);
  const now = new Date();

  // ========== VERIFY SHIPMENT (OPEN ONLY) ==========
  const shipmentExists = await Shipment.exists({
    _id: shipmentObjectId,
    shipperId,
    status: "CREATED",
    expiresAt: { $gt: now },
  });

  if (!shipmentExists) {
    throw new ApiError(
      404,
      "Shipment not found or not available for viewing bids"
    );
  }

  // ========== AGGREGATION ==========
  const bids = await Bid.aggregate([
    // 1️⃣ Only bids for this shipment
    {
      $match: {
        shipmentId: shipmentObjectId,
      },
    },

    // 2️⃣ Join carrier
    {
      $lookup: {
        from: "carriers",
        localField: "carrierId",
        foreignField: "_id",
        as: "carrier",
      },
    },
    { $unwind: "$carrier" },

    // 3️⃣ Join proposed vehicle
    {
      $lookup: {
        from: "vehicles",
        localField: "proposedVehicleId",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },

    // 4️⃣ Join shipment for budget price
    {
      $lookup: {
        from: "shipments",
        localField: "shipmentId",
        foreignField: "_id",
        as: "shipment",
      },
    },
    { $unwind: "$shipment" },

    // 5️⃣ Shape bid card data
    {
      $project: {
        // --- Bid identity ---
        bidId: "$_id",
        createdAt: 1,

        // --- Carrier ---
        carrierCompanyName: "$carrier.companyName",
        carrierAverageRating: "$carrier.averageRating",
        carrierRatingCount: "$carrier.ratingCount",

        // --- Pricing & transit ---
        bidAmount: 1,
        estimatedTransitHours: 1,
        budgetPrice: "$shipment.budgetPrice",

        // --- Vehicle ---
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        capacityTons: "$vehicle.capacityTons",
        capacityLitres: "$vehicle.capacityLitres",

        shipmentRef: "$shipment.shipmentRef",
      },
    },

    // 6️⃣ Optional: lowest bid first (UI friendly)
    {
      $sort: { bidAmount: 1 },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: bids.length,
        bids,
      },
      "Shipment bids fetched successfully"
    )
  );
});

export const getOpenShipmentBidDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access bid details");
  }

  const { bidId } = req.params;

  if (!bidId || !mongoose.Types.ObjectId.isValid(bidId)) {
    throw new ApiError(400, "Invalid bidId");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const bidObjectId = new mongoose.Types.ObjectId(bidId);

  // ========== AGGREGATION ==========
  const result = await Bid.aggregate([
    // 1️⃣ Match bid
    {
      $match: {
        _id: bidObjectId,
      },
    },

    // 2️⃣ Join shipment (must belong to this shipper & still CREATED)
    {
      $lookup: {
        from: "shipments",
        localField: "shipmentId",
        foreignField: "_id",
        as: "shipment",
      },
    },
    { $unwind: "$shipment" },

    {
      $match: {
        "shipment.shipperId": shipperId,
        "shipment.status": "CREATED",
      },
    },

    // 3️⃣ Join shipper (for company name)
    {
      $lookup: {
        from: "shippers",
        localField: "shipment.shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

    // 4️⃣ Join carrier
    {
      $lookup: {
        from: "carriers",
        localField: "carrierId",
        foreignField: "_id",
        as: "carrier",
      },
    },
    { $unwind: "$carrier" },

    // 5️⃣ Join proposed vehicle
    {
      $lookup: {
        from: "vehicles",
        localField: "proposedVehicleId",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },

    // 6️⃣ Shape details page data
    {
      $project: {
        // ---------- Shipment ----------
        shipmentRef: "$shipment.shipmentRef",
        shipperCompanyName: "$shipper.companyName",
        receiverCompanyName: "$shipment.receiverCompanyName",
        product: "$shipment.product",
        budgetPrice: "$shipment.budgetPrice",
        requiredVehicleTypes: "$shipment.requiredVehicleTypes",
        totalWeightTons: "$shipment.totalWeightTons",
        totalVolumeLitres: "$shipment.totalVolumeLitres",
        pickupLocation: "$shipment.pickupLocation",
        deliveryLocation: "$shipment.deliveryLocation",
        pickupDate: "$shipment.pickupDate",
        estimatedDeliveryDate: "$shipment.estimatedDeliveryDate",

        // ---------- Bid ----------
        bidId: "$_id",
        bidAmount: "$bidAmount",
        estimatedTransitHours: "$estimatedTransitHours",
        createdAt: 1,

        // ---------- Carrier ----------
        carrierCompanyName: "$carrier.companyName",
        carrierOwnerName: "$carrier.ownerName",
        carrierEmail: "$carrier.email",
        carrierPhone: "$carrier.phone",
        carrierGstNumber: "$carrier.gstNumber",
        carrierAddress: "$carrier.address",
        carrierAverageRating: "$carrier.averageRating",
        carrierRatingCount: "$carrier.ratingCount",
        carrierFleetSize: "$carrier.fleetSize",

        // ---------- Vehicle ----------
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        capacityTons: "$vehicle.capacityTons",
        capacityLitres: "$vehicle.capacityLitres",
        manufacturingYear: "$vehicle.manufacturingYear",
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(
      404,
      "Bid not found or not accessible"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bid: result[0],
      },
      "Bid details fetched successfully"
    )
  );
});

export const cancelShipment = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can cancel shipments");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const { shipmentId } = req.params;
  const { cancellationReason } = req.body;

  // ========== VALIDATION ==========
  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  if (cancellationReason && typeof cancellationReason !== "string") {
    throw new ApiError(400, "Cancellation reason must be a string");
  }

  if (cancellationReason && cancellationReason.trim().length > 500) {
    throw new ApiError(400, "Cancellation reason cannot exceed 500 characters");
  }

  // ========== FETCH SHIPMENT ==========
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new ApiError(404, "Shipment not found");
  }

  if (shipment.shipperId.toString() !== shipperId.toString()) {
    throw new ApiError(403, "You are not authorized to cancel this shipment");
  }

  if (shipment.status !== "CREATED") {
    throw new ApiError(
      400,
      `Shipment can only be cancelled if it is in CREATED status. Current status: ${shipment.status}`
    );
  }

  // ========== TRANSACTION ==========
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Find all PENDING bids to get their vehicle IDs
    const pendingBids = await Bid.find({
      shipmentId: new mongoose.Types.ObjectId(shipmentId),
      status: "PENDING",
    }).session(session);

    // 2️⃣ FREE UP VEHICLES from all bids
    for (const bid of pendingBids) {
      const vehicle = await Vehicle.findById(bid.proposedVehicleId).session(
        session
      );

      if (vehicle && vehicle.status === "BIDDED") {
        /* ---------- FREE VEHICLE ---------- */
        vehicle.status = "AVAILABLE";
        await vehicle.save({ session });
      }
    }

    // Update shipment status to CANCELLED
    const updatedShipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: cancellationReason ? cancellationReason.trim() : null,
      },
      { new: true, session }
    );

    // Cancel all associated PENDING bids
    await Bid.updateMany(
      {
        shipmentId: new mongoose.Types.ObjectId(shipmentId),
        status: "PENDING",
      },
      {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "shipper cancelled",
      },
      { session }
    );

    await session.commitTransaction();

    await Promise.all(
      pendingBids.map((bid) =>
        sendNotification({
          userId: bid.carrierId.toString(),
          type: NOTIF_TYPES.SHIPMENT_CANCELLED_BID,
          message: `A shipment you bid on (${shipment.shipmentRef}) has been cancelled by the shipper.`,
          shipmentId: shipment._id.toString(),
          metadata: {
            bidId: bid._id.toString(),
            cancellationReason: cancellationReason?.trim() || null,
          },
        })
      )
    );

    // ========== INVALIDATE REDIS CACHE ==========
    await redis.del("shipments:all");


    return res.status(200).json(
      new ApiResponse(
        200,
        {
          shipment: updatedShipment,
        },
        "Shipment cancelled successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const getCancelledShipments = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access this resource");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const now = new Date();

  // ========== MATCH CONDITION ==========
  const matchStage = { shipperId, status: "CANCELLED" };

  // ========== AGGREGATION ==========
  const shipments = await Shipment.aggregate([
    // 1️⃣ Match by tab
    { $match: matchStage },

    // 2️⃣ Lookup bids (for totalBids)
    {
      $lookup: {
        from: "bids",
        localField: "_id",
        foreignField: "shipmentId",
        as: "bids",
      },
    },

    // 3️⃣ Shape card-level data (EXACT match with getters)
    {
      $project: {
        // --- Receiver ---
        receiverCompanyName: 1,
        shipmentRef: 1,
        status: 1,

        // --- Route ---
        pickupCity: "$pickupLocation.city",
        deliveryCity: "$deliveryLocation.city",

        // --- Load ---
        product: 1,
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Pricing ---
        budgetPrice: 1,

        // --- Timeline ---
        biddingDeadline: 1,
        pickupDate: 1,
        estimatedDeliveryDate: 1,
        cancelledAt: 1,
        createdAt: 1,

        // --- Bids ---
        totalBids: { $size: "$bids" },
      },
    },

    // 4️⃣ Sorting (same as getters)
    {
      $sort: { cancelledAt: -1},
    },
  ]);

  if (!shipments || shipments.length === 0) {
    return res.status(200).json(new ApiResponse(200, {count: 0, shipments: []}, "No shipments found"))
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: shipments.length,
        shipments,
      },
      `Cancelled shipments fetched successfully`
    )
  );
});

export const getCancelledShipmentDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Only shippers can access this resource");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const shipperId = new mongoose.Types.ObjectId(authUser._id);
  const shipmentObjectId = new mongoose.Types.ObjectId(shipmentId);

  // ========== AGGREGATION ==========
  const result = await Shipment.aggregate([
    // 1️⃣ Match shipment of this shipper (CREATED or EXPIRED status)
    {
      $match: {
        _id: shipmentObjectId,
        shipperId,
        status: "CANCELLED",
      },
    },

    // 2️⃣ Join shipper (for company name consistency)
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

    // 3️⃣ Lookup bids (for total count)
    {
      $lookup: {
        from: "bids",
        localField: "_id",
        foreignField: "shipmentId",
        as: "bids",
      },
    },

    // 4️⃣ Shape details page data
    {
      $project: {
        // --- Status (to determine open/expired) ---
        status: 1,
        
        // --- Parties ---
        shipperCompanyName: "$shipper.companyName",
        receiverCompanyName: 1,

        // --- Identity ---
        shipmentRef: 1,

        // --- Product & description ---
        product: 1,
        description: 1,

        // --- Pricing ---
        budgetPrice: 1,

        // --- Vehicle requirement ---
        requiredVehicleTypes: 1,

        // --- Load ---
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Locations ---
        pickupLocation: 1,
        deliveryLocation: 1,

        // --- Timeline ---
        biddingDeadline: 1,
        expiresAt: 1,
        pickupDate: 1,
        estimatedDeliveryDate: 1,
        cancelledAt: 1,
        cancellationReason: 1,

        // --- Bids ---
        totalBids: { $size: "$bids" },
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(
      404,
      "Shipment not found or not accessible"
    );
  }

  const shipment = result[0];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shipment,
      },
      "Shipment details fetched successfully"
    )
  );
});