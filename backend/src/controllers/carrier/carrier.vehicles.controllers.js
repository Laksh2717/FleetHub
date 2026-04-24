import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Vehicle from "../../models/vehicle.model.js";
import Shipment from "../../models/shipment.model.js";
import Carrier from "../../models/carrier.model.js";
import mongoose from "mongoose";
import {
  isEmpty,
  isVehicleNumberValid,
  isManufacturingYearValid,
} from "../../utils/validations.js";

export const addVehicle = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can add vehicles");
  }

  const carrierId = authUser._id;

  let {
    vehicleNumber,
    vehicleType,
    capacityTons = 0,
    capacityLitres = 0,
    manufacturingYear,
  } = req.body;

  const errors = [];

  const requiredFields = {
    "Vehicle number": vehicleNumber,
    "Vehicle type": vehicleType,
    "Manufacturing year": manufacturingYear,
  };

  Object.entries(requiredFields).forEach(([label, value]) => {
    if (isEmpty(value)) errors.push(`${label} is required`);
  });

  vehicleNumber = vehicleNumber?.toUpperCase().trim();
  vehicleType = vehicleType?.toUpperCase().trim();

  if (!isVehicleNumberValid(vehicleNumber)) {
    errors.push("Invalid vehicle number");
  }

  if (!isManufacturingYearValid(manufacturingYear)) {
    errors.push("Invalid manufacturing year");
  }

  const ALLOWED_TYPES = [
    "TANKER",
    "LCV",
    "TRAILER_FLATBED",
    "OPEN_BODY",
    "CLOSED_CONTAINER",
    "REFRIGERATED",
  ];

  if (!ALLOWED_TYPES.includes(vehicleType)) {
    errors.push("Invalid vehicle type");
  }

  if (vehicleType === "TANKER") {
    if (capacityLitres <= 0)
      errors.push("TANKERS must have some capacity in litres");
    capacityTons = 0;
  } 
  else {
    if (capacityTons <= 0)
      errors.push("Non-tanker vehicle capacity must be greater than 0 tons");

    capacityLitres = 0;
  }

  if (errors.length > 0) throw new ApiError(400, errors.join(", "));

  const existingVehicle = await Vehicle.findOne({ vehicleNumber });

  if (existingVehicle) {
    throw new ApiError(
      409,
      "Vehicle with this number already exists"
    );
  }

  const vehicle = await Vehicle.create({
    vehicleType,
    vehicleNumber,
    capacityTons,
    capacityLitres,
    manufacturingYear,
    carrierId,
  });

  if (!vehicle) {
    throw new ApiError(500, "Something went wrong while adding the vehicle");
  }

  await Carrier.findByIdAndUpdate(
    carrierId,
    { $inc: { fleetSize: 1 } },
    { new: true }
  );

  return res
    .status(201)
    .json(new ApiResponse(201, vehicle, "Vehicle added successfully"));
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can delete vehicles");
  }

  const carrierId = authUser._id;
  const { vehicleId } = req.params;

  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    carrierId, 
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  const hasLoadHistory = await Shipment.exists({
    vehicleId: vehicleId
  });

  if (hasLoadHistory) {
    throw new ApiError(
      400,
      "Vehicle has load history. Retire instead of delete."
    );
  }

  await Vehicle.findByIdAndDelete(vehicleId);

  await Carrier.findByIdAndUpdate(
    carrierId,
    { $inc: { fleetSize: -1 } },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Vehicle deleted successfully"
    )
  );
});

export const retireVehicle = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can retire vehicles");
  }

  const carrierId = authUser._id;
  const { vehicleId } = req.params;

  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    carrierId, 
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  if (vehicle.status === "RETIRED") {
    throw new ApiError(400, "Vehicle is already retired");
  }

  if ( 
    vehicle.status === "BIDDED" ||
    vehicle.status === "ASSIGNED" ||
    vehicle.status === "IN_TRANSIT"
  ) {
    throw new ApiError(
      400,
      "Vehicle cannot be retired while bidded or assigned or in transit"
    );
  }

  vehicle.status = "RETIRED";
  await vehicle.save();

  await Carrier.findByIdAndUpdate(
    carrierId,
    { $inc: { fleetSize: -1 } },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { vehicle },
      "Vehicle retired successfully"
    )
  );
});

export const getVehicles = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access fleet vehicles");
  }

  const { tab = "all" } = req.query;

  if (!["all", "available", "in_use", "retired"].includes(tab)) {
    throw new ApiError(400, "Invalid tab value");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const isAllTab = tab === "all";

  // ---------- Tab-based filter ----------
  let matchStage = { carrierId };

  if (tab === "available") {
    matchStage.status = "AVAILABLE";
  } else if (tab === "in_use") {
    matchStage.status = { $in: ["BIDDED", "ASSIGNED", "IN_TRANSIT"] };
  } else if (tab === "retired") {
    matchStage.status = "RETIRED";
  }
  // tab === "all" → no status filter

  // ========== AGGREGATION ==========
  const vehicles = await Vehicle.aggregate([
    // 1️⃣ Filter by carrier + tab
    {
      $match: matchStage,
    },

    // 2️⃣ Derive UI status (explicit if–then–else)
    {
      $addFields: {
        uiStatus: {
          // IF vehicle is retired
          $cond: {
            if: { $eq: ["$status", "RETIRED"] },
            then: "RETIRED",

            // ELSE
            else: {
              $cond: {
                // IF (All tab AND vehicle is busy)
                if: {
                  $and: [
                    isAllTab,
                    {
                      $in: ["$status", ["BIDDED", "ASSIGNED", "IN_TRANSIT"]],
                    },
                  ],
                },
                then: "IN_USE",

                // ELSE
                else: "$status",
              },
            },
          },
        },
      },
    },

    // 3️⃣ Shape card data
    {
      $project: {
        vehicleId: "$_id",
        vehicleNumber: 1,
        vehicleType: 1,
        capacityTons: 1,
        capacityLitres: 1,
        manufacturingYear: 1,
        vehicleStatus: "$uiStatus",
        createdAt: 1,
        updatedAt: 1,
      },
    },

    // 4️⃣ Stable sorting
    {
      $sort: { updatedAt: -1 },
    },
  ]);

  if (!vehicles || vehicles.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { count: 0, vehicles: [] }, "No vehicles"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: vehicles.length,
        vehicles,
      },
      "Fleet vehicles fetched successfully"
    )
  );
});

export const getAvailableVehiclesForBid = asyncHandler(async (req, res) => {
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

  // ========== FETCH SHIPMENT ==========
  const shipment = await Shipment.findById(shipmentId).select(
    "requiredVehicleTypes"
  );

  if (!shipment) {
    throw new ApiError(404, "Shipment not found");
  }

  const requiredVehicleTypes = shipment.requiredVehicleTypes || [];

  // ========== VEHICLE QUERY ==========
  const vehicleQuery = {
    carrierId,
    status: "AVAILABLE",
    vehicleType: { $in: requiredVehicleTypes }
  };

  const vehicles = await Vehicle.find(vehicleQuery).select(
    "vehicleNumber vehicleType capacityTons capacityLitres"
  );

  if (!vehicles || vehicles.length === 0) 
    return res.status(200).json(new ApiResponse(200, {count: 0, vehicles: []}, "No vehicles available to bid"))

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: vehicles.length,
        vehicles,
      },
      "Available vehicles fetched successfully"
    )
  );
});

export const getVehicleDetails = asyncHandler(async (req, res) => {
  const authUser = req.user;

  // ========== AUTH ==========
  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Only carriers can access this resource");
  }

  const { vehicleId } = req.params;

  if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
    throw new ApiError(400, "Invalid vehicleId");
  }

  const carrierId = new mongoose.Types.ObjectId(authUser._id);
  const vehicleObjectId = new mongoose.Types.ObjectId(vehicleId);

  // ========== VEHICLE ==========
  const vehicle = await Vehicle.findOne({
    _id: vehicleObjectId,
    carrierId,
  }).select(
    "vehicleNumber vehicleType capacityTons capacityLitres manufacturingYear status"
  );

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found or not accessible");
  }

  // ========== ACTIVE SHIPMENT (for status) ==========
  const activeShipment = await Shipment.findOne({
    vehicleId: vehicleObjectId,
    status: { $in: ["ASSIGNED", "IN_TRANSIT"] },
  }).select("_id");

  // ---------- DERIVE CURRENT STATUS ----------
  let currentStatus = "AVAILABLE";

  if (vehicle.status === "RETIRED") {
    currentStatus = "RETIRED";
  } else if (vehicle.status === "BIDDED" || activeShipment) {
    currentStatus = "IN_USE";
  }

  // ========== COMPLETED TRIPS ==========
  const trips = await Shipment.aggregate([
    {
      $match: {
        vehicleId: vehicleObjectId,
        carrierId,
        status: "DELIVERED",
        paymentStatus: "COMPLETED",
      },
    },

    // Accepted bid (for earnings)
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

    // Shipper (company name)
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },

    // Shape trip cards
    {
      $project: {
        shipmentRef: 1,
        shipperCompanyName: "$shipper.companyName",
        receiverCompanyName: 1,
        pickupCity: "$pickupLocation.city",
        deliveryCity: "$deliveryLocation.city",
        deliveredAt: 1,
        bidAmount: "$acceptedBid.bidAmount",
        actualTransitHours: {
          $divide: [
            { $subtract: ["$deliveredAt", "$pickupConfirmedAt"] },
            1000 * 60 * 60,
          ],
        },
      },
    },

    { $sort: { deliveredAt: -1 } },
  ]);

  // ========== SUMMARY ==========
  const totalTrips = trips.length;

  const totalEarnings = trips.reduce(
    (sum, trip) => sum + (trip.bidAmount || 0),
    0
  );

  // ========== RESPONSE ==========
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          totalTrips,
          totalEarnings,
          currentStatus,
        },
        vehicle: {
          vehicleId: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicle.vehicleType,
          capacityTons: vehicle.capacityTons,
          capacityLitres: vehicle.capacityLitres,
          manufacturingYear: vehicle.manufacturingYear,
        },
        trips,
      },
      "Vehicle details fetched successfully"
    )
  );
});