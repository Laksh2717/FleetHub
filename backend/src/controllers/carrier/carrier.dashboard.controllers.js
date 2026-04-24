import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Payment from "../../models/payment.model.js";
import Shipment from "../../models/shipment.model.js";
import Vehicle from "../../models/vehicle.model.js";
import Carrier from "../../models/carrier.model.js";
import mongoose from "mongoose";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const buildEarningsTrend = ({ completedPayments, selectedYear, now, availableYears, earliestYear, earliestStartMonth }) => {
  const monthlyMap = {};
  let totalForYear = 0;

  for (const p of completedPayments) {
    if (!p.paidAt) continue;
    if (p.paidAt.getFullYear() !== selectedYear) continue;
    const m = p.paidAt.getMonth();
    monthlyMap[m] = (monthlyMap[m] || 0) + p.amount;
    totalForYear += p.amount;
  }

  const isCurrentYear = selectedYear === now.getFullYear();
  const isEarliestYear = selectedYear === earliestYear;
  const startMonth = isEarliestYear ? earliestStartMonth : 0;
  const endMonth = isCurrentYear ? now.getMonth() : 11;

  const monthlyEarnings = [];
  for (let i = startMonth; i <= endMonth; i++) {
    monthlyEarnings.push({ month: monthNames[i], amount: monthlyMap[i] || 0 });
  }

  return {
    selectedYear,
    availableYears,
    monthlyEarnings,
    totalForYear,
  };
};

export const getDashboard = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Access denied");
  }

  const carrierId = authUser._id;
  const now = new Date();
  const timeWindowDays = 14;

  /* =====================================================
     1️⃣ KPIs
     ===================================================== */

  const [
    completedPayments,
    pendingPayments,
    activeShipmentsCount,
    completedShipmentsCount,
    fleetSize,
    vehiclesInUse,
    carrierDoc,
  ] = await Promise.all([
    Payment.find({
      carrierId,
      status: "COMPLETED",
    }).select("amount paidAt"),

    Payment.find({
      carrierId,
      status: "PENDING",
    }).select("amount"),

    Shipment.countDocuments({
      carrierId,
      status: { $in: ["ASSIGNED", "IN_TRANSIT"] },
    }),

    Shipment.countDocuments({
      carrierId,
      status: "DELIVERED",
      paymentStatus: "COMPLETED",
    }),

    Vehicle.countDocuments({ carrierId }),

    Vehicle.countDocuments({
      carrierId,
      status: { $in: ["BIDDED", "ASSIGNED", "IN_TRANSIT"] },
    }),

    Carrier.findById(carrierId).select("averageRating ratingCount createdAt"),
  ]);

  let totalEarnings = 0;
  for (const p of completedPayments) {
    totalEarnings += p.amount || 0;
  }

  let pendingPaymentAmount = 0;
  for (const p of pendingPayments) {
    pendingPaymentAmount += p.amount || 0;
  }

  const kpis = {
    totalEarnings,
    activeShipments: activeShipmentsCount,
    pendingPayments: {
      count: pendingPayments.length,
      totalAmount: pendingPaymentAmount,
    },
    completedShipments: completedShipmentsCount,
    fleetSize,
    vehiclesInUse,
    rating: {
      average: carrierDoc?.averageRating || 0,
      count: carrierDoc?.ratingCount || 0,
    },
  };

  /* =====================================================
     2️⃣ ATTENTION REQUIRED (3 cases: payment pending, pickup pending, in-transit)
     Future: expiring soon, vehicle maintenance alerts, rating pending
     ===================================================== */

  const carrierIdObj = new mongoose.Types.ObjectId(carrierId);

  // Case 1: PAYMENT_PENDING (2 slots) - DELIVERED with pending payments
  const paymentPendingCandidates = await Payment.aggregate([
    { $match: { carrierId: carrierIdObj, status: "PENDING" } },
    {
      $lookup: {
        from: "shipments",
        localField: "shipmentId",
        foreignField: "_id",
        as: "shipment",
      },
    },
    { $unwind: "$shipment" },
    { $match: { "shipment.status": "DELIVERED" } },
    {
      $lookup: {
        from: "shippers",
        localField: "shipment.shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },
    { $sort: { "shipment.deliveredAt": 1 } },
    { $limit: 5 },
  ]);

  // Case 2: PICKUP_PENDING (2 slots) - ASSIGNED with accepted bid
  const pickupPendingCandidates = await Shipment.aggregate([
    { $match: { carrierId: carrierIdObj, status: "ASSIGNED" } },
    {
      $lookup: {
        from: "bids",
        localField: "_id",
        foreignField: "shipmentId",
        as: "bid",
      },
    },
    { $unwind: "$bid" },
    { $match: { "bid.status": "ACCEPTED" } },
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },
    { $sort: { pickupDate: 1 } },
    { $limit: 5 },
  ]);

  // Case 3: IN_TRANSIT (1 slot) - IN_TRANSIT with accepted bid
  const inTransitCandidates = await Shipment.aggregate([
    { $match: { carrierId: carrierIdObj, status: "IN_TRANSIT" } },
    {
      $lookup: {
        from: "bids",
        localField: "_id",
        foreignField: "shipmentId",
        as: "bid",
      },
    },
    { $unwind: "$bid" },
    { $match: { "bid.status": "ACCEPTED" } },
    {
      $lookup: {
        from: "shippers",
        localField: "shipperId",
        foreignField: "_id",
        as: "shipper",
      },
    },
    { $unwind: "$shipper" },
    { $sort: { pickupConfirmedAt: 1 } },
    { $limit: 5 },
  ]);

  const attentionRequired = [];

  // Base allocation: 2 payment + 2 pickup + 1 in-transit
  for (let i = 0; i < Math.min(2, paymentPendingCandidates.length); i++) {
    const p = paymentPendingCandidates[i];
    const s = p.shipment;
    const sh = p.shipper;
    attentionRequired.push({
      shipmentId: s._id,
      shipmentRef: s.shipmentRef,
      shipperCompanyName: sh?.companyName || "-",
      receiverCompanyName: s.receiverCompanyName,
      pickupCity: s.pickupLocation.city,
      deliveryCity: s.deliveryLocation.city,
      bidAmount: p.amount,
      status: "PAYMENT_PENDING",
      timeLabel: "Delivered At",
      timeValue: s.deliveredAt,
    });
  }

  for (let i = 0; i < Math.min(2, pickupPendingCandidates.length); i++) {
    if (attentionRequired.length >= 5) break;
    const s = pickupPendingCandidates[i];
    const sh = s.shipper;
    attentionRequired.push({
      shipmentId: s._id,
      shipmentRef: s.shipmentRef,
      shipperCompanyName: sh?.companyName || "-",
      receiverCompanyName: s.receiverCompanyName,
      pickupCity: s.pickupLocation.city,
      deliveryCity: s.deliveryLocation.city,
      bidAmount: s.bid.bidAmount,
      status: "PICKUP_PENDING",
      timeLabel: "Pickup Date",
      timeValue: s.pickupDate,
    });
  }

  if (attentionRequired.length < 5 && inTransitCandidates.length > 0) {
    const s = inTransitCandidates[0];
    const sh = s.shipper;
    attentionRequired.push({
      shipmentId: s._id,
      shipmentRef: s.shipmentRef,
      shipperCompanyName: sh?.companyName || "-",
      receiverCompanyName: s.receiverCompanyName,
      pickupCity: s.pickupLocation.city,
      deliveryCity: s.deliveryLocation.city,
      bidAmount: s.bid.bidAmount,
      status: "IN_TRANSIT",
      timeLabel: "Pickup Confirmed At",
      timeValue: s.pickupConfirmedAt,
    });
  }

  // Fill remaining slots (round-robin)
  let pp = 2, pu = 2, it = 1;
  while (attentionRequired.length < 5) {
    if (pp < paymentPendingCandidates.length) {
      const p = paymentPendingCandidates[pp++];
      const s = p.shipment;
      const sh = p.shipper;
      attentionRequired.push({
        shipmentId: s._id,
        shipmentRef: s.shipmentRef,
        shipperCompanyName: sh?.companyName || "-",
        receiverCompanyName: s.receiverCompanyName,
        pickupCity: s.pickupLocation.city,
        deliveryCity: s.deliveryLocation.city,
        bidAmount: p.amount,
        status: "PAYMENT_PENDING",
        timeLabel: "Delivered At",
        timeValue: s.deliveredAt,
      });
    } else if (pu < pickupPendingCandidates.length) {
      const s = pickupPendingCandidates[pu++];
      const sh = s.shipper;
      attentionRequired.push({
        shipmentId: s._id,
        shipmentRef: s.shipmentRef,
        shipperCompanyName: sh?.companyName || "-",
        receiverCompanyName: s.receiverCompanyName,
        pickupCity: s.pickupLocation.city,
        deliveryCity: s.deliveryLocation.city,
        bidAmount: s.bid.bidAmount,
        status: "PICKUP_PENDING",
        timeLabel: "Pickup Date",
        timeValue: s.pickupDate,
      });
    } else if (it < inTransitCandidates.length) {
      const s = inTransitCandidates[it++];
      const sh = s.shipper;
      attentionRequired.push({
        shipmentId: s._id,
        shipmentRef: s.shipmentRef,
        shipperCompanyName: sh?.companyName || "-",
        receiverCompanyName: s.receiverCompanyName,
        pickupCity: s.pickupLocation.city,
        deliveryCity: s.deliveryLocation.city,
        bidAmount: s.bid.bidAmount,
        status: "IN_TRANSIT",
        timeLabel: "Pickup Confirmed At",
        timeValue: s.pickupConfirmedAt,
      });
    } else {
      break;
    }
  }

  /* =====================================================
     3️⃣ GRAPHS
     ===================================================== */

  let earliestPaymentDate = null;
  for (const p of completedPayments) {
    if (p.paidAt && (!earliestPaymentDate || p.paidAt < earliestPaymentDate)) {
      earliestPaymentDate = p.paidAt;
    }
  }

  const currentYear = now.getFullYear();
  const carrierCreatedAt = carrierDoc?.createdAt ? new Date(carrierDoc.createdAt) : null;
  const carrierCreatedYear = carrierCreatedAt?.getFullYear();
  const carrierCreatedMonth = carrierCreatedAt?.getMonth();

  let earliestYear = currentYear;
  let earliestStartMonth = 0;

  if (earliestPaymentDate) {
    earliestYear = Math.min(earliestYear, earliestPaymentDate.getFullYear());
    if (earliestYear === earliestPaymentDate.getFullYear()) {
      earliestStartMonth = earliestPaymentDate.getMonth();
    }
  }

  if (carrierCreatedYear) {
    if (carrierCreatedYear < earliestYear) {
      earliestYear = carrierCreatedYear;
      earliestStartMonth = carrierCreatedMonth ?? 0;
    } else if (carrierCreatedYear === earliestYear && carrierCreatedMonth !== undefined) {
      earliestStartMonth = Math.min(earliestStartMonth, carrierCreatedMonth);
    }
  }

  const availableYears = [];
  for (let y = currentYear; y >= earliestYear; y--) {
    availableYears.push(y);
  }

  const selectedYear = currentYear;

  const earningsTrend = buildEarningsTrend({
    completedPayments,
    selectedYear,
    now,
    availableYears,
    earliestYear,
    earliestStartMonth,
  });

  const fromDate = new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000);

  const recentShipments = await Shipment.find({
    carrierId,
    createdAt: { $gte: fromDate },
  }).select("status paymentStatus");

  const dist = {
    ASSIGNED: 0,
    IN_TRANSIT: 0,
    PENDING_PAYMENT: 0,
    COMPLETED: 0,
  };

  for (const s of recentShipments) {
    if (s.status === "ASSIGNED") dist.ASSIGNED++;
    else if (s.status === "IN_TRANSIT") dist.IN_TRANSIT++;
    else if (s.status === "DELIVERED" && s.paymentStatus === "PENDING") dist.PENDING_PAYMENT++;
    else if (s.status === "DELIVERED" && s.paymentStatus === "COMPLETED") dist.COMPLETED++;
  }

  const graphs = {
    earningsTrend: {
      ...earningsTrend,
    },
    shipmentStatusDistribution: {
      timeWindowDays,
      distribution: [
        { status: "ASSIGNED", count: dist.ASSIGNED },
        { status: "IN_TRANSIT", count: dist.IN_TRANSIT },
        { status: "PENDING_PAYMENT", count: dist.PENDING_PAYMENT },
        { status: "COMPLETED", count: dist.COMPLETED },
      ],
    },
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      { kpis, attentionRequired, graphs },
      "Carrier dashboard data fetched successfully"
    )
  );
});

export const getEarningsTrendChart = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Access denied");
  }

  const carrierId = authUser._id;
  const now = new Date();

  const [completedPayments, carrierDoc] = await Promise.all([
    Payment.find({ carrierId, status: "COMPLETED" }).select("amount paidAt"),
    Carrier.findById(carrierId).select("createdAt"),
  ]);

  let earliestPaymentDate = null;
  for (const p of completedPayments) {
    if (p.paidAt && (!earliestPaymentDate || p.paidAt < earliestPaymentDate)) {
      earliestPaymentDate = p.paidAt;
    }
  }

  const currentYear = now.getFullYear();
  const carrierCreatedAt = carrierDoc?.createdAt ? new Date(carrierDoc.createdAt) : null;
  const carrierCreatedYear = carrierCreatedAt?.getFullYear();
  const carrierCreatedMonth = carrierCreatedAt?.getMonth();

  let earliestYear = currentYear;
  let earliestStartMonth = 0;

  if (earliestPaymentDate) {
    earliestYear = Math.min(earliestYear, earliestPaymentDate.getFullYear());
    if (earliestYear === earliestPaymentDate.getFullYear()) {
      earliestStartMonth = earliestPaymentDate.getMonth();
    }
  }

  if (carrierCreatedYear) {
    if (carrierCreatedYear < earliestYear) {
      earliestYear = carrierCreatedYear;
      earliestStartMonth = carrierCreatedMonth ?? 0;
    } else if (carrierCreatedYear === earliestYear && carrierCreatedMonth !== undefined) {
      earliestStartMonth = Math.min(earliestStartMonth, carrierCreatedMonth);
    }
  }

  const availableYears = [];
  for (let y = currentYear; y >= earliestYear; y--) {
    availableYears.push(y);
  }

  const requestedYear = Number.parseInt(req.query.year, 10);
  const selectedYear = availableYears.includes(requestedYear) ? requestedYear : currentYear;

  const earningsTrend = buildEarningsTrend({
    completedPayments,
    selectedYear,
    now,
    availableYears,
    earliestYear,
    earliestStartMonth,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { earningsTrend },
      "Earnings trend data fetched successfully"
    )
  );
});

export const getShipmentStatusChart = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "CARRIER") {
    throw new ApiError(403, "Access denied");
  }

  const carrierId = authUser._id;
  const now = new Date();
  
  const requestedWindow = Number.parseInt(req.query.timeWindowDays, 10);
  const timeWindowDays = [7, 14, 30].includes(requestedWindow) ? requestedWindow : 14;

  const fromDate = new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000);

  const recentShipments = await Shipment.find({
    carrierId,
    createdAt: { $gte: fromDate },
  }).select("status paymentStatus");

  const dist = {
    ASSIGNED: 0,
    IN_TRANSIT: 0,
    PENDING_PAYMENT: 0,
    COMPLETED: 0,
  };

  for (const s of recentShipments) {
    if (s.status === "ASSIGNED") dist.ASSIGNED++;
    else if (s.status === "IN_TRANSIT") dist.IN_TRANSIT++;
    else if (s.status === "DELIVERED" && s.paymentStatus === "PENDING") dist.PENDING_PAYMENT++;
    else if (s.status === "DELIVERED" && s.paymentStatus === "COMPLETED") dist.COMPLETED++;
  }

  const shipmentStatusDistribution = {
    timeWindowDays,
    distribution: [
      { status: "ASSIGNED", count: dist.ASSIGNED },
      { status: "IN_TRANSIT", count: dist.IN_TRANSIT },
      { status: "PENDING_PAYMENT", count: dist.PENDING_PAYMENT },
      { status: "COMPLETED", count: dist.COMPLETED },
    ],
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipmentStatusDistribution },
      "Shipment status chart data fetched successfully"
    )
  );
});