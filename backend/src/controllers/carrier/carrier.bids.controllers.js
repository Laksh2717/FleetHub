import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Bid from "../../models/bid.model.js";
import Shipment from "../../models/shipment.model.js";
import Vehicle from "../../models/vehicle.model.js";
import CarrierShipmentInteraction from "../../models/carrierShipmentInteraction.model.js";
import { sendNotification } from "../notification/notification.controllers.js";
import { NOTIF_TYPES } from "../../constants/notificationTypes.js";
import mongoose from "mongoose";

export const placeBid = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can place bids");
  }

  const carrierId = authUser._id;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let {
      shipmentId,
      bidAmount,
      estimatedTransitHours,
      proposedVehicleId,
    } = req.body;

    const errors = [];

    if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
      errors.push("Invalid shipmentId");
    }

    bidAmount = Number(bidAmount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      errors.push("Bid amount must be greater than 0");
    }

    estimatedTransitHours = Number(estimatedTransitHours);
    if (isNaN(estimatedTransitHours) || estimatedTransitHours <= 0) {
      errors.push("Estimated transit hours must be greater than 0");
    }

    if (
      !proposedVehicleId ||
      !mongoose.Types.ObjectId.isValid(proposedVehicleId)
    ) {
      errors.push("Invalid proposedVehicleId");
    }

    if (errors.length > 0) {
      throw new ApiError(400, errors.join(", "));
    }

    const shipment = await Shipment.findById(shipmentId).session(session);

    if (!shipment) {
      throw new ApiError(404, "Shipment not found");
    }

    if (shipment.status !== "CREATED") {
      throw new ApiError(400, "Bidding is not allowed on this shipment");
    }

    if (shipment.biddingDeadline <= new Date()) {
      throw new ApiError(400, "Bidding deadline has passed");
    }

    const existingBid = await Bid.findOne({
      shipmentId,
      carrierId,
      status: "PENDING",
    }).session(session);

    if (existingBid) {
      throw new ApiError(409, "Bid already placed for this shipment");
    }

    const vehicle = await Vehicle.findOne({
      _id: proposedVehicleId,
      carrierId,
    }).session(session);

    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }

    if (vehicle.status !== "AVAILABLE") {
      throw new ApiError(400, "Vehicle is not available");
    }

    if (!shipment.requiredVehicleTypes.includes(vehicle.vehicleType)) {
      throw new ApiError(
        400,
        "Vehicle type is not allowed for this shipment"
      );
    }

    const bid = await Bid.create(
      [{
        shipmentId,
        carrierId,
        bidAmount,
        estimatedTransitHours,
        proposedVehicleId,
      }],
      { session }
    );

    if (!bid || bid.length === 0) {
      throw new ApiError(500, "Failed to place bid");
    }

    await CarrierShipmentInteraction.create(
      [{
        carrierId,
        shipmentId,
        status: "BIDDED",
      }],
      { session }
    );

    vehicle.status = "BIDDED";
    await vehicle.save({ session });

    await session.commitTransaction();
    session.endSession();

    const totalBidCount = await Bid.countDocuments({
      shipmentId,
      status: "PENDING",
    });

    if (totalBidCount === 1) {
      await sendNotification({
        userId: shipment.shipperId.toString(),
        type: NOTIF_TYPES.FIRST_BID,
        message: `Your shipment ${shipment.shipmentRef} has received its first bid of ₹${bidAmount}!`,
        shipmentId: shipment._id.toString(),
        metadata: {
          bidId: bid[0]._id.toString(),
          carrierId: carrierId.toString(),
          bidAmount,
          estimatedTransitHours,
        },
      });
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        { bid: bid[0] },
        "Bid placed successfully"
      )
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

export const getActiveBidDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const { bidId } = req.params;

  if (!bidId || !mongoose.Types.ObjectId.isValid(bidId)) {
    throw new ApiError(400, "Invalid bidId");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const bidObjectId = new mongoose.Types.ObjectId(bidId);

  // ========== AGGREGATION ==========
  const result = await Bid.aggregate([
    // 1️⃣ Match pending bid of this carrier
    {
      $match: {
        _id: bidObjectId,
        carrierId,
        status: "PENDING",
      },
    },

    // 2️⃣ Join shipment
    {
      $lookup: {
        from: "shipments",
        localField: "shipmentId",
        foreignField: "_id",
        as: "shipment",
      },
    },
    { $unwind: "$shipment" },

    // 3️⃣ Join shipper
    {
      $lookup: {
        from: "shippers",
        localField: "shipment.shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

    // 4️⃣ Join vehicle
    {
      $lookup: {
        from: "vehicles",
        localField: "proposedVehicleId",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },

    // 5️⃣ Shape detail page data
    {
      $project: {
        // --- Bid identity ---
        bidId: "$_id",
        bidStatus: "$status",
        createdAt: 1,

        // --- Shipper details ---
        shipperCompanyName: "$shipper.companyName",
        shipperOwnerName: "$shipper.ownerName",
        shipperEmail: "$shipper.email",
        shipperPhone: "$shipper.phone",
        shipperGstNumber: "$shipper.gstNumber",
        shipperAddress: "$shipper.address",

        // --- Receiver ---
        receiverCompanyName: "$shipment.receiverCompanyName",

        // --- Shipment core ---
        shipmentId: "$shipment._id",
        shipmentRef: "$shipment.shipmentRef",
        product: "$shipment.product",
        description: "$shipment.description",
        budgetPrice: "$shipment.budgetPrice",
        requiredVehicleTypes: "$shipment.requiredVehicleTypes",
        totalWeightTons: "$shipment.totalWeightTons",
        totalVolumeLitres: "$shipment.totalVolumeLitres",

        // --- Timeline ---
        biddingDeadline: "$shipment.biddingDeadline",
        pickupDate: "$shipment.pickupDate",
        estimatedDeliveryDate: "$shipment.estimatedDeliveryDate",

        // --- Full locations ---
        pickupLocation: "$shipment.pickupLocation",
        deliveryLocation: "$shipment.deliveryLocation",

        // --- Vehicle (proposed) ---
        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        capacityTons: "$vehicle.capacityTons",
        capacityLitres: "$vehicle.capacityLitres",
        manufacturingYear: "$vehicle.manufacturingYear",

        // --- Bid details ---
        bidAmount: "$bidAmount",
        estimatedTransitHours: 1,
        statusChangedOn: 1,
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(
      404,
      "Pending bid not found or not accessible"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bid: result[0],
      },
      "Pending bid details fetched successfully"
    )
  );
});

export const deleteBid = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can delete bids");
  }

  const { bidId } = req.params;

  if (!bidId || !mongoose.Types.ObjectId.isValid(bidId)) {
    throw new ApiError(400, "Invalid bidId");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const bid = await Bid.findOne({
      _id: bidId,
      carrierId,
      status: "PENDING",
    }).session(session);

    if (!bid) {
      throw new ApiError(404, "Pending bid not found or not accessible");
    }

    const shipment = await Shipment.findById(bid.shipmentId).session(session);

    if (!shipment) {
      throw new ApiError(404, "Shipment not found");
    }

    if (shipment.status !== "CREATED") {
      throw new ApiError(400, "Cannot delete bid for a shipment that is no longer open for bidding");
    }

    if (shipment.biddingDeadline <= new Date()) {
      throw new ApiError(400, "Cannot delete bid after bidding deadline");
    }

    const vehicle = await Vehicle.findOne({
      _id: bid.proposedVehicleId,
      carrierId,
    }).session(session);

    if (vehicle && vehicle.status === "BIDDED") {
      vehicle.status = "AVAILABLE";
      await vehicle.save({ session });
    }

    await CarrierShipmentInteraction.deleteOne({
      carrierId,
      shipmentId: bid.shipmentId,
    }).session(session);

    // Cancel the bid instead of deleting it
    bid.status = "CANCELLED";
    bid.cancelledAt = new Date();
    bid.cancellationReason = "you cancelled";
    await bid.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResponse(200, {}, "Bid cancelled successfully")
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

export const getMyBids = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const { tab } = req.query;

  if (!["active", "accepted", "rejected", "cancelled"].includes(tab)) {
    throw new ApiError(400, "Invalid tab value");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);

  // Map tab → bid status
  const statusMap = {
    active: "PENDING",
    accepted: "ACCEPTED",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
  };

  const sortStage = tab === "active"
      ? { "shipment.biddingDeadline": 1 }
      : { updatedAt: -1 };

  // ========== AGGREGATION ==========
  const bids = await Bid.aggregate([
    // 1️⃣ Match bids by tab
    {
      $match: {
        carrierId,
        status: statusMap[tab],
      },
    },

    // 2️⃣ Join shipment
    {
      $lookup: {
        from: "shipments",
        localField: "shipmentId",
        foreignField: "_id",
        as: "shipment",
      },
    },
    { $unwind: "$shipment" },

    // 3️⃣ Join shipper
    {
      $lookup: {
        from: "shippers",
        localField: "shipment.shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

    // 3️⃣.5 Join receiver (shipper for receiver company)
    {
      $lookup: {
        from: "shippers",
        localField: "shipment.receiverId",
        foreignField: "_id",
        as: "receiver",
      },
    },
    { $unwind: { path: "$receiver", preserveNullAndEmptyArrays: true } },

    // 4️⃣ Join proposed vehicle
    {
      $lookup: {
        from: "vehicles",
        localField: "proposedVehicleId",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },

    // 5️⃣ Shape card data (conditional fields by tab)
    {
      $project: {
        bidId: "$_id",
        bidStatus: "$status",
        createdAt: 1,
        updatedAt: 1,
        // --- Always ---
        shipmentId: "$shipment._id",
        shipmentRef: "$shipment.shipmentRef",
        product: "$shipment.product",
        shipperCompanyName: "$shipper.companyName",
        receiverCompanyName: "$shipment.receiverCompanyName",
        shipmentStatus: "$shipment.status",
        paymentStatus: "$shipment.paymentStatus",

        pickupCity: "$shipment.pickupLocation.city",
        deliveryCity: "$shipment.deliveryLocation.city",

        budgetPrice: "$shipment.budgetPrice",
        bidAmount: "$bidAmount",

        totalWeightTons: "$shipment.totalWeightTons",
        totalVolumeLitres: "$shipment.totalVolumeLitres",

        vehicleNumber: "$vehicle.vehicleNumber",
        vehicleType: "$vehicle.vehicleType",
        statusChangedOn: 1,
        cancelledAt: 1,
        cancellationReason: 1,

        // --- ACTIVE only ---
        biddingDeadline: {
          $cond: [
            { $eq: ["$status", "PENDING"] },
            "$shipment.biddingDeadline",
            "$$REMOVE",
          ],
        },
        pickupDate: {
          $cond: [
            { $eq: ["$status", "PENDING"] },
            "$shipment.pickupDate",
            "$$REMOVE",
          ],
        },
        estimatedDeliveryDate: {
          $cond: [
            { $eq: ["$status", "PENDING"] },
            "$shipment.estimatedDeliveryDate",
            "$$REMOVE",
          ],
        },
      },
    },

    // 6️⃣ Sorting (tab-specific)
    {
      $sort: sortStage,
    },
  ]);

  if (!bids || bids.length === 0) {
    return res.status(200).json(new ApiResponse(200,
      {count: 0, bids: []},
      "No bids found"
    ))
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: bids.length,
        bids,
      },
      "My bids fetched successfully"
    )
  );
});

