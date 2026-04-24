import crypto from "crypto";
import ApiResponse from "../../utils/apiResponse.js";
import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import Payment from "../../models/payment.model.js";
import Shipment from "../../models/shipment.model.js";
import Bid from "../../models/bid.model.js";
import razorpay from "../../config/razorpay.config.js";
import { sendNotification } from "../notification/notification.controllers.js";
import { NOTIF_TYPES } from "../../constants/notificationTypes.js";

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const authUser = req.user;
  
  if (!authUser) {
    throw new ApiError(401, "Unauthorized");
  }
  
  const shipperId = req.user._id;
  const { shipmentId } = req.body;

  const shipment = await Shipment.findOne({
    _id: shipmentId,
    shipperId,
    status: "DELIVERED",
    paymentStatus: "PENDING",
  });
  
  if (!shipment) {
    throw new ApiError(400, "Invalid Shipment for payment");
  }

  // Find or create payment
  let payment = await Payment.findOne({ shipmentId });

  if (!payment) {
    const acceptedBid = await Bid.findOne({
      shipmentId,
      status: "ACCEPTED",
    });

    if (!acceptedBid) {
      throw new ApiError(500, "Accepted bid not found");
    }

    payment = await Payment.create({
      shipmentId,
      shipperId,
      carrierId: acceptedBid.carrierId,
      amount: acceptedBid.bidAmount,
    });
  }

  const order = await razorpay.orders.create({
    amount: payment.amount * 100, // paise
    currency: "INR",
    receipt: `pay_${shipmentId.toString().slice(-12)}_${Date.now().toString().slice(-8)}`,
  });

  payment.razorpayOrderId = order.id;
  await payment.save();

  return res.status(200).json(
    new ApiResponse(200 ,{
      orderId: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    },
      "Payment order created successfully"
    )
  );
});

export const razorpayWebhook = async (req, res) => {
  console.log("WEBHOOK HIT");
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // Handle raw body - try multiple sources
    let bodyString = null;

    if (req.rawBody) bodyString = req.rawBody;
    else if (req.body) {
      if (typeof req.body === 'string') bodyString = req.body;
      else if (Buffer.isBuffer(req.body)) bodyString = req.body.toString('utf8');
      else bodyString = JSON.stringify(req.body);
    } 
    else {
      return res.status(200).json(
        new ApiResponse(200, {}, "Webhook received but no body found")
      );
    }

    if (!bodyString) {
      return res.status(200).json(
        new ApiResponse(200, {}, "Webhook received but body is empty")
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyString)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(200).json(
        new ApiResponse(200, {}, "Webhook received but signature invalid")
      );
    }

    // Parse body from the raw body string we captured
    let body;
    try {
      body = JSON.parse(bodyString);
    } catch (parseError) {
      return res.status(200).json(
        new ApiResponse(200, {}, "Webhook received but body parsing failed")
      );
    }

    const event = body.event;

    if (event === "payment.captured") {
      const razorpayOrderId = body.payload.payment.entity.order_id;
      const razorpayPaymentId = body.payload.payment.entity.id;
      const payment = await Payment.findOne({ razorpayOrderId });

      if (!payment) {
        return res.status(200).json(
          new ApiResponse(200, {}, "Webhook processed - payment record not found")
        );
      }

      if (payment.status !== "COMPLETED") {
        payment.status = "COMPLETED";
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.paidAt = new Date();
        await payment.save();

        await Shipment.findByIdAndUpdate(payment.shipmentId, {
          paymentStatus: "COMPLETED",
        });

        await sendNotification({
          userId: payment.carrierId.toString(),
          type: NOTIF_TYPES.PAYMENT_RECEIVED,
          message: `Payment of ₹${payment.amount} has been received for your shipment.`,
          shipmentId: payment.shipmentId.toString(),
          metadata: {
            amount: payment.amount,
            razorpayPaymentId,
            paidAt: payment.paidAt.toISOString(),
          },
        });

      }
    }

    return res.status(200).json(
      new ApiResponse(200, {}, "Webhook processed successfully")
    );
  } catch (error) {
    return res.status(200).json(
      new ApiResponse(200, {}, "Webhook received and logged")
    );
  }
};
