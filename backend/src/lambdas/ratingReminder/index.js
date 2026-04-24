import connectDB from "../shared/db.js";
import { sendNotification } from "../shared/notify.js";
import mongoose from "mongoose";

const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", new mongoose.Schema({
  shipperId: mongoose.Schema.Types.ObjectId,
  status: String,
  paymentStatus: String,
  isRated: Boolean,
  deliveredAt: Date,
  shipmentRef: String,
}));

const Payment = mongoose.models.Payment || mongoose.model("Payment", new mongoose.Schema({
  shipmentId: mongoose.Schema.Types.ObjectId,
  status: String,
  paidAt: Date,
}));

export const handler = async () => {
  await connectDB();

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const oneDayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // find payments completed 24-48 hours ago
  const payments = await Payment.find({
    status: "COMPLETED",
    paidAt: { $gte: twoDaysAgo, $lte: oneDayAgo },
  });

  await Promise.all(
    payments.map(async (payment) => {
      const shipment = await Shipment.findOne({
        _id: payment.shipmentId,
        isRated: false,
      });

      if (!shipment) return; // already rated, skip

      await sendNotification({
        userId: shipment.shipperId.toString(),
        type: "RATING_REMINDER",
        message: `Don't forget to rate your carrier for shipment ${shipment.shipmentRef}.`,
        shipmentId: shipment._id.toString(),
        metadata: { paidAt: payment.paidAt.toISOString() },
      });
    })
  );

  console.log(`#15 processed ${payments.length} payments checked`);
};