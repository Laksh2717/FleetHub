import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Shipment from "../../models/shipment.model.js";
import Vehicle from "../../models/vehicle.model.js";
import Bid from "../../models/bid.model.js";
import Payment from "../../models/payment.model.js";
import CarrierShipmentInteraction from "../../models/carrierShipmentInteraction.model.js";
import redis from "../../config/redis.config.js";
import mongoose from "mongoose";
import { sendNotification } from "../notification/notification.controllers.js";
import { NOTIF_TYPES } from "../../constants/notificationTypes.js";

export const confirmDelivery = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carrier can mark delivery");
  }

  const { shipmentId } = req.params;
  let { deliveredAt } = req.body;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  // ---------- deliveredAt handling ----------
  if (deliveredAt) {
    deliveredAt = new Date(deliveredAt);
    if (isNaN(deliveredAt.getTime())) {
      throw new ApiError(400, "deliveredAt must be a valid date");
    }
  } else {
    deliveredAt = new Date(); // default: now
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    /* ---------- FETCH SHIPMENT ---------- */
    const shipment = await Shipment.findById(shipmentId).session(session);

    if (!shipment) {
      throw new ApiError(404, "Shipment not found");
    }

    if (shipment.carrierId.toString() !== authUser._id.toString()) {
      throw new ApiError(
        403,
        "You are not authorized to mark this shipment delivered"
      );
    }

    if (shipment.status !== "IN_TRANSIT") {
      throw new ApiError(
        400,
        "Shipment must be IN_TRANSIT to mark delivered"
      );
    }

    if (!shipment.pickupConfirmedAt) {
      throw new ApiError(
        400,
        "Pickup not confirmed. Cannot mark delivery."
      );
    }

    if (deliveredAt < shipment.pickupConfirmedAt) {
      throw new ApiError(
        400,
        "deliveredAt cannot be before pickupConfirmedAt"
      );
    }

    /* ---------- UPDATE SHIPMENT ---------- */
    shipment.status = "DELIVERED";
    shipment.deliveredAt = deliveredAt;
    // paymentStatus remains PENDING (as per your model design)

    await shipment.save({ session });

    /* ---------- FREE VEHICLE ---------- */
    await Vehicle.findByIdAndUpdate(
      shipment.vehicleId,
      { status: "AVAILABLE" },
      { session }
    );

    /* ---------- CREATE PAYMENT RECORD ---------- */
    const acceptedBid = await Bid.findOne({
      shipmentId: shipment._id,
      status: "ACCEPTED",
    }).session(session);

    if (!acceptedBid) {
      throw new ApiError(500, "Accepted bid not found");
    }

    await Payment.create(
      [
        {
          shipmentId: shipment._id,
          shipperId: shipment.shipperId,
          carrierId: shipment.carrierId,
          amount: acceptedBid.bidAmount,
          status: "PENDING",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await sendNotification({
      userId: shipment.shipperId.toString(),
      type: NOTIF_TYPES.DELIVERY_CONFIRMED,
      message: `Your shipment ${shipment.shipmentRef} has been delivered. Please complete the payment.`,
      shipmentId: shipment._id.toString(),
      metadata: {
        carrierId: shipment.carrierId.toString(),
        deliveredAt: deliveredAt.toISOString(),
        amount: acceptedBid.bidAmount,
      },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        "Shipment marked delivered successfully"
      )
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

export const confirmPickup = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can confirm pickup");
  }

  const carrierId = authUser._id;
  const { shipmentId } = req.params;

  let { pickupConfirmedAt } = req.body;

  const errors = [];

  // ========== VALIDATION ==========
  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    errors.push("Invalid shipmentId");
  }

  if (!pickupConfirmedAt) {
    errors.push("pickupConfirmedAt is required");
  }

  pickupConfirmedAt = new Date(pickupConfirmedAt);
  if (isNaN(pickupConfirmedAt.getTime())) {
    errors.push("pickupConfirmedAt must be a valid date");
  }

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    /* ---------- FETCH SHIPMENT ---------- */
    const shipment = await Shipment.findById(shipmentId).session(session);

    if (!shipment) {
      throw new ApiError(404, "Shipment not found");
    }

    // ========== AUTHORIZATION ==========
    if (shipment.carrierId.toString() !== carrierId.toString()) {
      throw new ApiError(
        403,
        "You are not authorized to confirm pickup for this shipment"
      );
    }

    // ========== BUSINESS RULES ==========
    if (shipment.status !== "ASSIGNED") {
      throw new ApiError(
        400,
        "Pickup can only be confirmed for ASSIGNED shipments"
      );
    }

    if (shipment.pickupConfirmedAt) {
      throw new ApiError(400, "Pickup already confirmed for this shipment");
    }

    /* ---------- UPDATE SHIPMENT ---------- */
    shipment.pickupConfirmedAt = pickupConfirmedAt;
    shipment.status = "IN_TRANSIT";

    await shipment.save({ session });

    /* ---------- UPDATE VEHICLE ---------- */
    await Vehicle.findByIdAndUpdate(
      shipment.vehicleId,
      { status: "IN_TRANSIT" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await sendNotification({
      userId: shipment.shipperId.toString(),
      type: NOTIF_TYPES.PICKUP_CONFIRMED,
      message: `Your shipment ${shipment.shipmentRef} has been picked up and is now in transit.`,
      shipmentId: shipment._id.toString(),
      metadata: {
        carrierId: shipment.carrierId.toString(),
        pickupConfirmedAt: pickupConfirmedAt.toISOString(),
      },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { shipment },
        "Pickup confirmed successfully"
      )
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

export const markShipmentNotInterested = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can perform this action");
  }

  const carrierId = authUser._id;
  const { shipmentId } = req.params;

  const errors = [];

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    errors.push("Invalid shipmentId");
  }

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new ApiError(404, "Shipment not found");
  }

  if (shipment.status !== "CREATED") {
    throw new ApiError(
      400,
      "Cannot mark interest on this shipment"
    );
  }

  const existingInteraction = await CarrierShipmentInteraction.findOne({
    carrierId,
    shipmentId,
  });

  if (existingInteraction) {
    throw new ApiError(
      409,
      "Carrier already interacted with this shipment"
    );
  }

  const interaction = await CarrierShipmentInteraction.create({
    carrierId,
    shipmentId,
    status: "NOT_INTERESTED",
  });

  if (!interaction) {
    throw new ApiError(
      500,
      "Failed to mark shipment as not interested"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Shipment marked as not interested"
    )
  );
});

export const getCompletedShipmentsDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const shipmentObjectId = new mongoose.Types.ObjectId(shipmentId);

  // ========== AGGREGATION ==========
  const result = await Shipment.aggregate([
    // 1️⃣ Match delivered shipment with completed payment
    {
      $match: {
        _id: shipmentObjectId,
        carrierId,
        status: "DELIVERED",
        paymentStatus: "COMPLETED",
      },
    },

    // 2️⃣ Join shipper
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

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

    // 5️⃣ Join payment (to get paidAt)
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "shipmentId",
        as: "payment",
      },
    },
    { $unwind: "$payment" },

    // 6️⃣ Join rating (rating GIVEN TO carrier)
    {
      $lookup: {
        from: "ratings",
        let: { shipmentId: "$_id", carrierId: "$carrierId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$shipmentId", "$$shipmentId"] },
                  { $eq: ["$ratedCarrierId", "$$carrierId"] },
                ],
              },
            },
          },
        ],
        as: "rating",
      },
    },

    // 7️⃣ Shape detail page data
    {
      $project: {
        // --- Shipper details ---
        shipperCompanyName: "$shipper.companyName",
        shipperOwnerName: "$shipper.ownerName",
        shipperEmail: "$shipper.email",
        shipperPhone: "$shipper.phone",
        shipperGstNumber: "$shipper.gstNumber",
        shipperAddress: "$shipper.address",

        // --- Shipment identity & parties ---
        shipmentRef: 1,
        receiverCompanyName: 1,

        // --- Product & load ---
        product: 1,
        description: 1,
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Locations ---
        pickupLocation: 1,
        deliveryLocation: 1,

        // --- Timeline ---
        pickupDate: 1,
        pickupConfirmedAt: 1,
        estimatedDeliveryDate: 1,
        deliveredAt: 1,

        // --- Transit ---
        estimatedTransitHours: "$acceptedBid.estimatedTransitHours",
        actualTransitHours: {
          $cond: [
            {
              $and: [
                { $ne: ["$pickupConfirmedAt", null] },
                { $ne: ["$deliveredAt", null] },
              ],
            },
            {
              $round: [
                {
                  $divide: [
                    { $subtract: ["$deliveredAt", "$pickupConfirmedAt"] },
                    1000 * 60 * 60,
                  ],
                },
                0,
              ],
            },
            null,
          ],
        },

        // --- Vehicle ---
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        manufacturingYear: "$vehicle.manufacturingYear",
        capacityTons: "$vehicle.capacityTons",
        capacityLitres: "$vehicle.capacityLitres",

        // --- Financials ---
        budgetPrice: 1,
        bidAmount: "$acceptedBid.bidAmount",
        paymentStatus: 1,
        paidAt: "$payment.paidAt",

        // --- Rating ---
        isRated: { $gt: [{ $size: "$rating" }, 0] },
        ratingValue: {
          $cond: [
            { $gt: [{ $size: "$rating" }, 0] },
            { $arrayElemAt: ["$rating.rating", 0] },
            null,
          ],
        },
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(
      404,
      "Completed shipment not found or not accessible"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipment: result[0] },
      "Completed shipment details fetched successfully"
    )
  );
});

export const getPendingPaymentShipmentDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const shipmentObjectId = new mongoose.Types.ObjectId(shipmentId);

  // ========== AGGREGATION ==========
  const result = await Shipment.aggregate([
    // 1️⃣ Match delivered shipment with pending payment
    {
      $match: {
        _id: shipmentObjectId,
        carrierId,
        status: "DELIVERED",
        paymentStatus: "PENDING",
      },
    },

    // 2️⃣ Join shipper
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

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

    // 5️⃣ Shape detail page data
    {
      $project: {
        // --- Shipper details ---
        shipperCompanyName: "$shipper.companyName",
        shipperOwnerName: "$shipper.ownerName",
        shipperEmail: "$shipper.email",
        shipperPhone: "$shipper.phone",
        shipperGstNumber: "$shipper.gstNumber",
        shipperAddress: "$shipper.address",

        // --- Shipment ---
        shipmentRef: 1,
        receiverCompanyName: 1,

        // --- Product & load ---
        product: 1,
        description: 1,
        budgetPrice: 1,
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Locations ---
        pickupLocation: 1,
        deliveryLocation: 1,

        // --- Timeline ---
        pickupDate: 1,
        pickupConfirmedAt: 1,
        estimatedDeliveryDate: 1,
        deliveredAt: 1,

        // --- Transit ---
        estimatedTransitHours: "$acceptedBid.estimatedTransitHours",
        actualTransitHours: {
          $cond: [
            {
              $and: [
                { $ne: ["$pickupConfirmedAt", null] },
                { $ne: ["$deliveredAt", null] },
              ],
            },
            {
              $round: [
                {
                  $divide: [
                    { $subtract: ["$deliveredAt", "$pickupConfirmedAt"] },
                    1000 * 60 * 60,
                  ],
                },
                0,
              ],
            },
            null,
          ],
        },

        // --- Vehicle ---
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        manufacturingYear: "$vehicle.manufacturingYear",
        capacityTons: "$vehicle.capacityTons",
        capacityLitres: "$vehicle.capacityLitres",

        // --- Financial ---
        bidAmount: "$acceptedBid.bidAmount",
        paymentStatus: 1,
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(
      404,
      "Pending payment shipment not found or not accessible"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipment: result[0] },
      "Pending payment shipment details fetched successfully"
    )
  );
});

export const getCompletedShipments = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);

  // ========== AGGREGATION ==========
  const shipments = await Shipment.aggregate([
    // 1️⃣ Delivered shipments with completed payment
    {
      $match: {
        carrierId,
        status: "DELIVERED",
        paymentStatus: "COMPLETED",
      },
    },

    // 2️⃣ Join shipper
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

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

    // 5️⃣ Join payment (to get paidAt)
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "shipmentId",
        as: "payment",
      },
    },
    { $unwind: "$payment" },

    // 6️⃣ Join rating (rating given TO carrier)
    {
      $lookup: {
        from: "ratings",
        let: { shipmentId: "$_id", carrierId: "$carrierId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$shipmentId", "$$shipmentId"] },
                  { $eq: ["$ratedCarrierId", "$$carrierId"] },
                ],
              },
            },
          },
        ],
        as: "rating",
      },
    },

    // 7️⃣ Shape card data
    {
      $project: {
        // --- Identity ---
        shipmentRef: 1,

        // --- Parties ---
        shipperCompanyName: "$shipper.companyName",
        receiverCompanyName: 1,

        // --- Product ---
        product: 1,

        // --- Route ---
        pickupCity: "$pickupLocation.city",
        deliveryCity: "$deliveryLocation.city",

        // --- Pricing ---
        budgetPrice: 1,
        bidAmount: "$acceptedBid.bidAmount",

        // --- Timeline ---
        deliveredAt: 1,
        paidAt: "$payment.paidAt",

        // --- Transit ---
        actualTransitHours: {
          $cond: [
            {
              $and: [
                { $ne: ["$pickupConfirmedAt", null] },
                { $ne: ["$deliveredAt", null] },
              ],
            },
            {
              $round: [
                {
                  $divide: [
                    { $subtract: ["$deliveredAt", "$pickupConfirmedAt"] },
                    1000 * 60 * 60,
                  ],
                },
                0,
              ],
            },
            null,
          ],
        },

        // --- Vehicle ---
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        capacityTons: "$vehicle.capacityTons",
        capacityLitres: "$vehicle.capacityLitres",

        // --- Load ---
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Rating ---
        isRated: { $gt: [{ $size: "$rating" }, 0] },
        ratingValue: {
          $cond: [
            { $gt: [{ $size: "$rating" }, 0] },
            { $arrayElemAt: ["$rating.rating", 0] },
            null,
          ],
        },
      },
    },

    // 8️⃣ Most recent first
    {
      $sort: { deliveredAt: -1 },
    },
  ]);

  if (!shipments || shipments.length === 0) {
    return res.status(200).json(new ApiResponse(200, 
      {count:0, shipments: []}, 
      "No shipments found")
    )
  }

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

export const getPendingPaymentShipments = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);

  // ========== AGGREGATION ==========
  const shipments = await Shipment.aggregate([
    // 1️⃣ Delivered shipments with pending payment
    {
      $match: {
        carrierId,
        status: "DELIVERED",
        paymentStatus: "PENDING",
      },
    },

    // 2️⃣ Join shipper
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

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

    // 5️⃣ Shape card data
    {
      $project: {
        // --- Identity ---
        shipmentRef: 1,
        product: 1,

        // --- Parties ---
        shipperCompanyName: "$shipper.companyName",
        receiverCompanyName: 1,

        // --- Route ---
        pickupCity: "$pickupLocation.city",
        deliveryCity: "$deliveryLocation.city",

        // --- Pricing ---
        bidAmount: "$acceptedBid.bidAmount",
        budgetPrice: 1,

        // --- Timeline ---
        pickupConfirmedAt: 1,
        deliveredAt: 1,

        // --- Vehicle ---
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",

        // --- Load ---
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Payment ---
        paymentStatus: 1,
      },
    },

    // 6️⃣ Most recent first
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

export const getActiveShipments = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const { tab } = req.query;

  if (!tab || !["assigned", "in-transit"].includes(tab)) {
    throw new ApiError(
      400,
      "Invalid tab. Allowed values: assigned, in-transit"
    );
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const status = tab === "assigned" ? "ASSIGNED" : "IN_TRANSIT";

  // Get counts for both tabs
  const [assignedCount, inTransitCount] = await Promise.all([
    Shipment.countDocuments({ carrierId, status: "ASSIGNED" }),
    Shipment.countDocuments({ carrierId, status: "IN_TRANSIT" })
  ]);

  // ========== BASE PROJECT (COMMON FIELDS) ==========
  const baseProject = {
    // --- Identity ---
    shipmentRef: 1,

    // --- Parties ---
    shipperCompanyName: "$shipper.companyName",
    receiverCompanyName: 1,

    // --- Route ---
    pickupCity: "$pickupLocation.city",
    deliveryCity: "$deliveryLocation.city",

    // --- Product ---
    product: 1,

    // --- Agreement ---
    bidAmount: "$acceptedBid.bidAmount",
    estimatedTransitHours: "$acceptedBid.estimatedTransitHours",

    // --- Vehicle ---
    vehicleNumber: "$vehicle.vehicleNumber",
    vehicleType: "$vehicle.vehicleType",
    capacityTons: "$vehicle.capacityTons",
    capacityLitres: "$vehicle.capacityLitres",

    // --- Load ---
    totalWeightTons: 1,
    totalVolumeLitres: 1,

    // --- Timeline (common planned date) ---
    pickupDate: 1,
  };

  // ========== TAB-SPECIFIC EXTENSION ==========
  const projectStage =
    tab === "assigned"
      ? baseProject
      : {
          ...baseProject,
          pickupConfirmedAt: 1,
        };

  // ========== AGGREGATION ==========
  const shipments = await Shipment.aggregate([
    // 1️⃣ Match carrier + status
    {
      $match: {
        carrierId,
        status,
      },
    },

    // 2️⃣ Join shipper
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

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

export const getActiveShipmentDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const shipmentObjectId = new mongoose.Types.ObjectId(shipmentId);

  // ========== AGGREGATION ==========
  const result = await Shipment.aggregate([
    // 1️⃣ Match active shipment
    {
      $match: {
        _id: shipmentObjectId,
        carrierId,
        status: { $in: ["ASSIGNED", "IN_TRANSIT"] },
      },
    },

    // 2️⃣ Join shipper
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

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

    // 5️⃣ Conditional projection (CORRECT WAY)
    {
      $project: {
        // --- Status ---
        status: 1,

        // --- Shipper ---
        shipperCompanyName: "$shipper.companyName",
        shipperOwnerName: "$shipper.ownerName",
        shipperEmail: "$shipper.email",
        shipperPhone: "$shipper.phone",
        shipperGstNumber: "$shipper.gstNumber",
        shipperAddress: "$shipper.address",

        // --- Shipment ---
        shipmentRef: 1,
        receiverCompanyName: 1,

        // --- Product & load ---
        product: 1,
        description: 1,
        budgetPrice: 1,
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Locations ---
        pickupLocation: 1,
        deliveryLocation: 1,

        // --- Timeline ---
        pickupDate: 1,
        estimatedDeliveryDate: 1,

        // ❗ ONLY FOR IN_TRANSIT
        pickupConfirmedAt: {
          $cond: [
            { $eq: ["$status", "IN_TRANSIT"] },
            "$pickupConfirmedAt",
            "$$REMOVE",
          ],
        },

        // --- Vehicle ---
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        manufacturingYear: "$vehicle.manufacturingYear",
        capacityTons: "$vehicle.capacityTons",
        capacityLitres: "$vehicle.capacityLitres",

        // --- Agreement ---
        bidAmount: "$acceptedBid.bidAmount",
        estimatedTransitHours: "$acceptedBid.estimatedTransitHours",
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(
      404,
      "Active shipment not found or not accessible"
    );
  }

  const shipment = result[0];

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipment },
      "Active shipment details fetched successfully"
    )
  );
});

export const findShipments = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  // ========== PAGINATION ==========
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 12;
  if (page < 1) page = 1;
  if (limit < 1) limit = 12;
  if (limit > 100) limit = 100;
  const skip = (page - 1) * limit;

  // ========== FILTERS & SEARCH ==========
  const pickupSearch = req.query.pickupSearch?.trim() || "";
  const deliverySearch = req.query.deliverySearch?.trim() || "";
  const vehicleType = req.query.vehicleType?.trim() || "";
  const sortBy = req.query.sortBy || "latest";
  const sortOrder = req.query.sortOrder?.toLowerCase() === "desc" ? -1 : 1;

  const carrierId = new mongoose.Types.ObjectId(authUser._id);

  const sortObject = {};
  if (sortBy === "price") {
    sortObject.budgetPrice = sortOrder;
  } else if (sortBy === "deadline") {
    sortObject.biddingDeadline = sortOrder;
  } else {
    sortObject.createdAt = sortOrder;
  }

  // ========== CASE 1 — FILTERS APPLIED → SKIP CACHE, HIT MONGODB ==========
  if (pickupSearch || deliverySearch || vehicleType) {
    const now = new Date();

    const matchConditions = {
      status: "CREATED",
      biddingDeadline: { $gt: now },
    };

    if (pickupSearch) {
      matchConditions.$or = [
        { "pickupLocation.street": { $regex: pickupSearch, $options: "i" } },
        { "pickupLocation.city": { $regex: pickupSearch, $options: "i" } },
        { "pickupLocation.state": { $regex: pickupSearch, $options: "i" } },
        { "pickupLocation.pincode": { $regex: pickupSearch, $options: "i" } },
      ];
    }

    if (deliverySearch) {
      if (matchConditions.$or) {
        matchConditions.$and = [
          { $or: matchConditions.$or },
          {
            $or: [
              { "deliveryLocation.street": { $regex: deliverySearch, $options: "i" } },
              { "deliveryLocation.city": { $regex: deliverySearch, $options: "i" } },
              { "deliveryLocation.state": { $regex: deliverySearch, $options: "i" } },
              { "deliveryLocation.pincode": { $regex: deliverySearch, $options: "i" } },
            ],
          },
        ];
        delete matchConditions.$or;
      } else {
        matchConditions.$or = [
          { "deliveryLocation.street": { $regex: deliverySearch, $options: "i" } },
          { "deliveryLocation.city": { $regex: deliverySearch, $options: "i" } },
          { "deliveryLocation.state": { $regex: deliverySearch, $options: "i" } },
          { "deliveryLocation.pincode": { $regex: deliverySearch, $options: "i" } },
        ];
      }
    }

    if (vehicleType) {
      matchConditions.requiredVehicleTypes = { $in: [vehicleType] };
    }

    // full aggregation with carrier interaction lookup — same as your original
    const result = await Shipment.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "carriershipmentinteractions",
          let: { shipmentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$shipmentId", "$$shipmentId"] },
                    { $eq: ["$carrierId", carrierId] },
                    { $in: ["$status", ["BIDDED", "NOT_INTERESTED"]] },
                  ],
                },
              },
            },
          ],
          as: "carrierInteraction",
        },
      },
      { $match: { carrierInteraction: { $size: 0 } } },
      {
        $lookup: {
          from: "shippers",
          localField: "shipperId",
          foreignField: "_id",
          as: "shipper",
        },
      },
      { $unwind: "$shipper" },
      {
        $project: {
          _id: 1,
          shipmentRef: 1,
          receiverCompanyName: 1,
          product: 1,
          pickupCity: "$pickupLocation.city",
          deliveryCity: "$deliveryLocation.city",
          totalWeightTons: 1,
          totalVolumeLitres: 1,
          budgetPrice: 1,
          requiredVehicleTypes: 1,
          pickupDate: 1,
          estimatedDeliveryDate: 1,
          biddingDeadline: 1,
          shipperCompanyName: "$shipper.companyName",
          createdAt: 1,
        },
      },
      { $sort: sortObject },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          shipments: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    const total = result[0].metadata[0]?.total || 0;
    const shipments = result[0].shipments;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json(
      new ApiResponse(200, {
        page, limit, total, totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        count: shipments.length,
        shipments,
        filters: {
          pickupSearch, deliverySearch, vehicleType,
          sortBy, sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
      }, "Available shipments fetched successfully")
    );
  }

  // ========== CASE 2 — NO FILTERS → TRY REDIS FIRST ==========
  const cacheKey = `shipments:all`;

  let allShipments = null;

  // ========== REDIS HIT ==========
  const cached = await redis.get(cacheKey);
  if (cached) {
    allShipments = JSON.parse(cached);
  } else {
    // ========== REDIS MISS → HIT MONGODB ==========
    // no carrier interaction lookup here — done in app layer below
    allShipments = await Shipment.aggregate([
      { $match: { status: "CREATED" } },
      {
        $lookup: {
          from: "shippers",
          localField: "shipperId",
          foreignField: "_id",
          as: "shipper",
        },
      },
      { $unwind: "$shipper" },
      {
        $project: {
          _id: 1,
          shipmentRef: 1,
          receiverCompanyName: 1,
          product: 1,
          pickupCity: "$pickupLocation.city",
          deliveryCity: "$deliveryLocation.city",
          totalWeightTons: 1,
          totalVolumeLitres: 1,
          budgetPrice: 1,
          requiredVehicleTypes: 1,
          pickupDate: 1,
          estimatedDeliveryDate: 1,
          biddingDeadline: 1,
          shipperCompanyName: "$shipper.companyName",
          createdAt: 1,
        },
      },
    ]);


    // store in Redis with 1 hour TTL
    await redis.set(cacheKey, JSON.stringify(allShipments), "EX", 3600);

  }

  // ========== APP LAYER FILTER 1 — deadline ==========
  const now = new Date();
  const activeShipments = allShipments.filter(
    (s) => new Date(s.biddingDeadline) > now
  );


  // ========== APP LAYER FILTER 2 — carrier interactions ==========
  const interactions = await CarrierShipmentInteraction.find({
    carrierId,
  }).select("shipmentId");

  const excludedIds = new Set(
    interactions.map((i) => i.shipmentId.toString())
  );

  const filteredShipments = activeShipments.filter(
    (s) => !excludedIds.has(s._id.toString())
  );


  // ========== APP LAYER SORT =========
  filteredShipments.sort((a, b) => {
    if (sortBy === "price") {
      return sortOrder === 1
        ? a.budgetPrice - b.budgetPrice
        : b.budgetPrice - a.budgetPrice;
    }
    if (sortBy === "deadline") {
      return sortOrder === 1
        ? new Date(a.biddingDeadline) - new Date(b.biddingDeadline)
        : new Date(b.biddingDeadline) - new Date(a.biddingDeadline);
    }
    return sortOrder === 1
      ? new Date(a.createdAt) - new Date(b.createdAt)
      : new Date(b.createdAt) - new Date(a.createdAt);
  });

  // ========== PAGINATE IN APP LAYER ==========
  const total = filteredShipments.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedShipments = filteredShipments.slice(skip, skip + limit);

  return res.status(200).json(
    new ApiResponse(200, {
      page, limit, total, totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      count: paginatedShipments.length,
      shipments: paginatedShipments,
      filters: {
        pickupSearch, deliverySearch, vehicleType,
        sortBy, sortOrder: sortOrder === 1 ? "asc" : "desc",
      },
    }, "Available shipments fetched successfully")
  );
});

export const findShipmentDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const { shipmentId } = req.params;

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const shipmentObjectId = new mongoose.Types.ObjectId(shipmentId);
  const now = new Date();

  // ========== AGGREGATION ==========
  const result = await Shipment.aggregate([
    // 1️⃣ Match shipment (only valid for find shipments page)
    {
      $match: {
        _id: shipmentObjectId,
        status: "CREATED",
        biddingDeadline: { $gt: now },
      },
    },

    // 2️⃣ Exclude shipments already interacted with by carrier
    {
      $lookup: {
        from: "carriershipmentinteractions",
        let: { shipmentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$shipmentId", "$$shipmentId"] },
                  { $eq: ["$carrierId", carrierId] },
                  {
                    $in: ["$status", ["BIDDED", "NOT_INTERESTED"]],
                  },
                ],
              },
            },
          },
        ],
        as: "carrierInteraction",
      },
    },
    {
      $match: {
        carrierInteraction: { $size: 0 },
      },
    },

    // 3️⃣ Join shipper details
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

    // 4️⃣ Shape response for detail page
    {
      $project: {
        _id: 1,

        // --- Shipper details ---
        shipperCompanyName: "$shipper.companyName",
        shipperOwnerName: "$shipper.ownerName",
        shipperPhone: "$shipper.phone",
        shipperEmail: "$shipper.email",
        shipperGstNumber: "$shipper.gstNumber",

        // --- Receiver ---
        receiverCompanyName: 1,

        // --- Shipment core ---
        shipmentRef: 1,
        product: 1,
        description: 1,
        budgetPrice: 1,
        requiredVehicleTypes: 1,
        totalWeightTons: 1,
        totalVolumeLitres: 1,

        // --- Timeline ---
        biddingDeadline: 1,
        pickupDate: 1,
        estimatedDeliveryDate: 1,

        // --- Full locations ---
        pickupLocation: 1,
        deliveryLocation: 1,
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(
      404,
      "Shipment not found or no longer available for bidding"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipment: result[0] },
      "Shipment details fetched successfully"
    )
  );
});