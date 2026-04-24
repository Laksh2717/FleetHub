import connectDB from "../shared/db.js";
import { sendNotification } from "../shared/notify.js";
import mongoose from "mongoose";

const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", new mongoose.Schema({
  shipperId: mongoose.Schema.Types.ObjectId,
  status: String,
  paymentStatus: String,
  deliveredAt: Date,
  shipmentRef: String,
}));

export const handler = async () => {
  await connectDB();

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const oneDayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const shipments = await Shipment.find({
    status: "DELIVERED",
    paymentStatus: "PENDING",
    deliveredAt: { $gte: twoDaysAgo, $lte: oneDayAgo },
  });

  await Promise.all(
    shipments.map((s) =>
      sendNotification({
        userId: s.shipperId.toString(),
        type: "PAYMENT_REMINDER",
        message: `Payment for shipment ${s.shipmentRef} is still pending. Please complete it.`,
        shipmentId: s._id.toString(),
        metadata: { deliveredAt: s.deliveredAt.toISOString() },
      })
    )
  );

  console.log(`#13 processed ${shipments.length} shipments`);
};