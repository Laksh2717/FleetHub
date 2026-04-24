import connectDB from "../shared/db.js";
import { sendNotification } from "../shared/notify.js";
import mongoose from "mongoose";

const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", new mongoose.Schema({
  shipperId: mongoose.Schema.Types.ObjectId,
  status: String,
  expiresAt: Date,
  shipmentRef: String,
}));

export const handler = async () => {
  await connectDB();

  const now = new Date();
  const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23hrs = new Date(now.getTime() + 23 * 60 * 60 * 1000);

  const shipments = await Shipment.find({
    status: "CREATED",
    expiresAt: { $gte: in23hrs, $lte: in24hrs },
  });

  await Promise.all(
    shipments.map((s) =>
      sendNotification({
        userId: s.shipperId.toString(),
        type: "EXPIRY_WARNING",
        message: `Shipment ${s.shipmentRef} will expire in less than 24 hours with no carrier assigned.`,
        shipmentId: s._id.toString(),
        metadata: { expiresAt: s.expiresAt.toISOString() },
      })
    )
  );

  console.log(`#5 processed ${shipments.length} shipments`);
};