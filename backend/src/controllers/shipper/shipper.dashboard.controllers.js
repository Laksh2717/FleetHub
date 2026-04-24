import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import Payment from "../../models/payment.model.js";
import Shipment from "../../models/shipment.model.js";
import Shipper from "../../models/shipper.model.js";
import mongoose from "mongoose";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const buildShipmentCostTrend = ({ completedPayments, pendingPayments, selectedYear, now, availableYears, earliestYear, earliestStartMonth }) => {
  const monthlyMap = {};
  let paidAmount = 0;

  // Only include completed payments in the graph
  for (const p of completedPayments) {
    if (!p.paidAt) continue;
    if (p.paidAt.getFullYear() !== selectedYear) continue;

    const m = p.paidAt.getMonth();
    monthlyMap[m] = (monthlyMap[m] || 0) + p.amount;
    paidAmount += p.amount;
  }

  const isCurrentYear = selectedYear === now.getFullYear();
  const isEarliestYear = selectedYear === earliestYear;
  const startMonth = isEarliestYear ? earliestStartMonth : 0;
  const endMonth = isCurrentYear ? now.getMonth() : 11;

  const monthlyCost = [];
  for (let i = startMonth; i <= endMonth; i++) {
    monthlyCost.push({ month: monthNames[i], amount: monthlyMap[i] || 0 });
  }

  return {
    selectedYear,
    availableYears,
    monthlyCost,
    paidAmount,
    pendingAmount: 0, // No pending in graph
  };
};

export const getDashboard = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Access denied");
  }

  const shipperId = authUser._id;
  const shipperIdObj = new mongoose.Types.ObjectId(shipperId);
  const now = new Date();

  /* =====================================================
     1️⃣ KPIs
     ===================================================== */

  const [
    completedPayments,
    pendingPayments,
    activeShipmentsCount,
    completedShipmentsCount,
    unassignedShipmentsCount,
  ] = await Promise.all([
    Payment.find({
      shipperId,
      status: "COMPLETED",
    }).select("amount paidAt"),

    Payment.find({
      shipperId,
      status: "PENDING",
    }).select("amount"),

    Shipment.countDocuments({
      shipperId,
      status: { $in: ["ASSIGNED", "IN_TRANSIT"] },
    }),

    Shipment.countDocuments({
      shipperId,
      status: "DELIVERED",
      paymentStatus: "COMPLETED",
    }),

    Shipment.countDocuments({
      shipperId,
      status: "CREATED",
      biddingDeadline: { $lte: now },
      expiresAt: { $gt: now },
    }),
  ]);

  let totalSpend = 0;
  for (const p of completedPayments) totalSpend += p.amount || 0;
  for (const p of pendingPayments) totalSpend += p.amount || 0;

  let pendingPaymentAmount = 0;
  for (const p of pendingPayments) pendingPaymentAmount += p.amount || 0;

  const kpis = {
    totalSpend,
    pendingPayments: {
      count: pendingPayments.length,
      totalAmount: pendingPaymentAmount,
    },
    activeShipments: activeShipmentsCount,
    completedShipments: completedShipmentsCount,
    unassignedShipments: unassignedShipmentsCount,
  };

  /* =====================================================
     2️⃣ ATTENTION REQUIRED (2 + 2 + 1 with fill)
     Priority:
     1. PAYMENT_PENDING
     2. UNASSIGNED
     3. PICKUP_PENDING
     ===================================================== */

  const attentionRequired = [];

  /* ---- Fetch candidates (upper bounded) ---- */

  const paymentPendingCandidates = await Shipment.aggregate([
    {
      $match: {
        shipperId: shipperIdObj,
        status: "DELIVERED",
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "shipmentId",
        as: "payment",
      },
    },
    { $unwind: "$payment" },
    { $match: { "payment.status": "PENDING" } },
    {
      $lookup: {
        from: "carriers",
        localField: "carrierId",
        foreignField: "_id",
        as: "carrier",
      },
    },
    { $unwind: { path: "$carrier", preserveNullAndEmptyArrays: true } },
    { $sort: { deliveredAt: 1 } },
    { $limit: 5 },
  ]);

  const unassignedCandidates = await Shipment.aggregate([
    {
      $match: {
        shipperId: shipperIdObj,
        status: "CREATED",
        biddingDeadline: { $lte: now },
        expiresAt: { $gt: now },
      },
    },
    {
      $lookup: {
        from: "bids",
        localField: "_id",
        foreignField: "shipmentId",
        as: "bids",
      },
    },
    {
      $match: {
        $expr: { $eq: [{ $size: "$bids" }, 0] },
      },
    },
    { $sort: { expiresAt: 1 } },
    { $limit: 5 },
  ]);

  const pickupPendingCandidates = await Shipment.aggregate([
    {
      $match: {
        shipperId: shipperIdObj,
        status: "ASSIGNED",
        pickupConfirmedAt: null,
        pickupDate: { $lt: now },
      },
    },
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
        from: "carriers",
        localField: "carrierId",
        foreignField: "_id",
        as: "carrier",
      },
    },
    { $unwind: { path: "$carrier", preserveNullAndEmptyArrays: true } },
    { $sort: { pickupDate: 1 } },
    { $limit: 5 },
  ]);

  /* ---- Base allocation (2,2,1) ---- */

  for (let i = 0; i < Math.min(2, paymentPendingCandidates.length); i++) {
    const s = paymentPendingCandidates[i];
    const c = s.carrier;
    attentionRequired.push({
      shipmentId: s._id,
      shipmentRef: s.shipmentRef,
      carrierCompanyName: c?.companyName || "-",
      receiverCompanyName: s.receiverCompanyName,
      pickupCity: s.pickupLocation.city,
      deliveryCity: s.deliveryLocation.city,
      amount: s.payment.amount,
      status: "PAYMENT_PENDING",
      timeLabel: "Delivered At",
      timeValue: s.deliveredAt,
    });
  }

  for (let i = 0; i < Math.min(2, unassignedCandidates.length); i++) {
    if (attentionRequired.length >= 5) break;
    const s = unassignedCandidates[i];
    attentionRequired.push({
      shipmentId: s._id,
      shipmentRef: s.shipmentRef,
      receiverCompanyName: s.receiverCompanyName,
      pickupCity: s.pickupLocation.city,
      deliveryCity: s.deliveryLocation.city,
      amount: s.budgetPrice,
      status: "UNASSIGNED",
      timeLabel: "Expires At",
      timeValue: s.expiresAt,
    });
  }

  if (attentionRequired.length < 5 && pickupPendingCandidates.length > 0) {
    const s = pickupPendingCandidates[0];
    const c = s.carrier;
    attentionRequired.push({
      shipmentId: s._id,
      shipmentRef: s.shipmentRef,
      carrierCompanyName: c?.companyName || "-",
      receiverCompanyName: s.receiverCompanyName,
      pickupCity: s.pickupLocation.city,
      deliveryCity: s.deliveryLocation.city,
      amount: s.bid.bidAmount,
      status: "PICKUP_PENDING",
      timeLabel: "Pickup Date",
      timeValue: s.pickupDate,
    });
  }

  /* ---- Fill remaining slots ---- */

  let pp = 2, ua = 2, pu = 1;

  while (attentionRequired.length < 5) {
    if (pp < paymentPendingCandidates.length) {
      const s = paymentPendingCandidates[pp++];
      const c = s.carrier;
      attentionRequired.push({
        shipmentId: s._id,
        shipmentRef: s.shipmentRef,
        carrierCompanyName: c?.companyName || "-",
        receiverCompanyName: s.receiverCompanyName,
        pickupCity: s.pickupLocation.city,
        deliveryCity: s.deliveryLocation.city,
        amount: s.payment.amount,
        status: "PAYMENT_PENDING",
        timeLabel: "Delivered At",
        timeValue: s.deliveredAt,
      });
    } else if (ua < unassignedCandidates.length) {
      const s = unassignedCandidates[ua++];
      attentionRequired.push({
        shipmentId: s._id,
        shipmentRef: s.shipmentRef,
        receiverCompanyName: s.receiverCompanyName,
        pickupCity: s.pickupLocation.city,
        deliveryCity: s.deliveryLocation.city,
        amount: s.budgetPrice,
        status: "UNASSIGNED",
        timeLabel: "Expires At",
        timeValue: s.expiresAt,
      });
    } else if (pu < pickupPendingCandidates.length) {
      const s = pickupPendingCandidates[pu++];
      const c = s.carrier;
      attentionRequired.push({
        shipmentId: s._id,
        shipmentRef: s.shipmentRef,
        carrierCompanyName: c?.companyName || "-",
        receiverCompanyName: s.receiverCompanyName,
        pickupCity: s.pickupLocation.city,
        deliveryCity: s.deliveryLocation.city,
        amount: s.bid.bidAmount,
        status: "PICKUP_PENDING",
        timeLabel: "Pickup Date",
        timeValue: s.pickupDate,
      });
    } else {
      break;
    }
  }

  /* =====================================================
     3️⃣ GRAPHS
     ===================================================== */

  const timeWindowDays = 14;

  let earliestPaymentDate = null;
  for (const p of [...completedPayments, ...pendingPayments]) {
    if (p.paidAt && (!earliestPaymentDate || p.paidAt < earliestPaymentDate)) {
      earliestPaymentDate = p.paidAt;
    }
  }

  const currentYear = now.getFullYear();
  const shipperDoc = await Shipper.findById(shipperId).select("createdAt");
  const shipperCreatedAt = shipperDoc?.createdAt ? new Date(shipperDoc.createdAt) : null;
  const shipperCreatedYear = shipperCreatedAt?.getFullYear();
  const shipperCreatedMonth = shipperCreatedAt?.getMonth();

  let earliestYear = currentYear;
  let earliestStartMonth = 0;

  if (earliestPaymentDate) {
    earliestYear = Math.min(earliestYear, earliestPaymentDate.getFullYear());
    if (earliestYear === earliestPaymentDate.getFullYear()) {
      earliestStartMonth = earliestPaymentDate.getMonth();
    }
  }

  if (shipperCreatedYear) {
    if (shipperCreatedYear < earliestYear) {
      earliestYear = shipperCreatedYear;
      earliestStartMonth = shipperCreatedMonth ?? 0;
    } else if (shipperCreatedYear === earliestYear && shipperCreatedMonth !== undefined) {
      earliestStartMonth = Math.min(earliestStartMonth, shipperCreatedMonth);
    }
  }

  const availableYears = [];
  for (let y = currentYear; y >= earliestYear; y--) {
    availableYears.push(y);
  }

  const selectedYear = currentYear;

  const shipmentCostTrend = buildShipmentCostTrend({
    completedPayments,
    pendingPayments,
    selectedYear,
    now,
    availableYears,
    earliestYear,
    earliestStartMonth,
  });

  const fromDate = new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000);

  const recentShipments = await Shipment.find({
    shipperId,
    createdAt: { $gte: fromDate },
  }).select("status");

  const dist = {
    CREATED: 0,
    ASSIGNED: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
  };

  for (const s of recentShipments) {
    if (dist[s.status] !== undefined) dist[s.status]++;
  }

  const graphs = {
    shipmentCostTrend: {
      ...shipmentCostTrend,
    },
    shipmentStatusDistribution: {
      timeWindowDays,
      distribution: [
        { status: "CREATED", count: dist.CREATED },
        { status: "ASSIGNED", count: dist.ASSIGNED },
        { status: "IN_TRANSIT", count: dist.IN_TRANSIT },
        { status: "DELIVERED", count: dist.DELIVERED },
      ],
    },
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      { kpis, attentionRequired, graphs },
      "Shipper dashboard data fetched successfully"
    )
  );
});

export const getShipmentCostTrendChart = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Access denied");
  }

  const shipperId = authUser._id;
  const now = new Date();

  const [completedPayments, pendingPayments, shipperDoc] = await Promise.all([
    Payment.find({ shipperId, status: "COMPLETED" }).select("amount paidAt"),
    Payment.find({ shipperId, status: "PENDING" }).select("amount paidAt"),
    Shipper.findById(shipperId).select("createdAt"),
  ]);

  let earliestPaymentDate = null;
  for (const p of [...completedPayments, ...pendingPayments]) {
    if (p.paidAt && (!earliestPaymentDate || p.paidAt < earliestPaymentDate)) {
      earliestPaymentDate = p.paidAt;
    }
  }

  const currentYear = now.getFullYear();
  const shipperCreatedAt = shipperDoc?.createdAt ? new Date(shipperDoc.createdAt) : null;
  const shipperCreatedYear = shipperCreatedAt?.getFullYear();
  const shipperCreatedMonth = shipperCreatedAt?.getMonth();

  let earliestYear = currentYear;
  let earliestStartMonth = 0;

  if (earliestPaymentDate) {
    earliestYear = Math.min(earliestYear, earliestPaymentDate.getFullYear());
    if (earliestYear === earliestPaymentDate.getFullYear()) {
      earliestStartMonth = earliestPaymentDate.getMonth();
    }
  }

  if (shipperCreatedYear) {
    if (shipperCreatedYear < earliestYear) {
      earliestYear = shipperCreatedYear;
      earliestStartMonth = shipperCreatedMonth ?? 0;
    } else if (shipperCreatedYear === earliestYear && shipperCreatedMonth !== undefined) {
      earliestStartMonth = Math.min(earliestStartMonth, shipperCreatedMonth);
    }
  }

  const availableYears = [];
  for (let y = currentYear; y >= earliestYear; y--) {
    availableYears.push(y);
  }

  const requestedYear = Number.parseInt(req.query.year, 10);
  const selectedYear = availableYears.includes(requestedYear) ? requestedYear : currentYear;

  const shipmentCostTrend = buildShipmentCostTrend({
    completedPayments,
    pendingPayments,
    selectedYear,
    now,
    availableYears,
    earliestYear,
    earliestStartMonth,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { shipmentCostTrend },
      "Shipment cost trend data fetched successfully"
    )
  );
});

export const getShipmentStatusChart = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser || authUser.role !== "SHIPPER") {
    throw new ApiError(403, "Access denied");
  }

  const shipperId = authUser._id;
  const now = new Date();
  
  const requestedWindow = Number.parseInt(req.query.timeWindowDays, 10);
  const timeWindowDays = [7, 14, 30].includes(requestedWindow) ? requestedWindow : 14;

  const fromDate = new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000);

  const recentShipments = await Shipment.find({
    shipperId,
    createdAt: { $gte: fromDate },
  }).select("status");

  const dist = {
    CREATED: 0,
    ASSIGNED: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
  };

  for (const s of recentShipments) {
    if (dist[s.status] !== undefined) dist[s.status]++;
  }

  const shipmentStatusDistribution = {
    timeWindowDays,
    distribution: [
      { status: "CREATED", count: dist.CREATED },
      { status: "ASSIGNED", count: dist.ASSIGNED },
      { status: "IN_TRANSIT", count: dist.IN_TRANSIT },
      { status: "DELIVERED", count: dist.DELIVERED },
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