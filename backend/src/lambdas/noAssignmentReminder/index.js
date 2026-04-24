import connectDB from "../shared/db.js";
import { sendNotification } from "../shared/notify.js";
import mongoose from "mongoose";

const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", new mongoose.Schema({
  shipperId: mongoose.Schema.Types.ObjectId,
  status: String,
  biddingDeadline: Date,
  shipmentRef: String,
}));

export const handler = async () => {
  await connectDB();

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const oneDayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // deadline was 24-48 hours ago, still CREATED (not ASSIGNED)
  const shipments = await Shipment.find({
    status: "CREATED",
    biddingDeadline: { $gte: twoDaysAgo, $lte: oneDayAgo },
  });

  await Promise.all(
    shipments.map((s) =>
      sendNotification({
        userId: s.shipperId.toString(),
        type: "NO_ASSIGNMENT_REMINDER",
        message: `Shipment ${s.shipmentRef} still has no carrier assigned 1 day after the bidding deadline.`,
        shipmentId: s._id.toString(),
        metadata: { biddingDeadline: s.biddingDeadline.toISOString() },
      })
    )
  );

  console.log(`#4 processed ${shipments.length} shipments`);
};