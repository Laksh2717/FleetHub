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
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // deadline passed in the last hour, shipment still CREATED (no bid accepted yet)
  const shipments = await Shipment.find({
    status: "CREATED",
    biddingDeadline: { $gte: oneHourAgo, $lte: now },
  });

  await Promise.all(
    shipments.map((s) =>
      sendNotification({
        userId: s.shipperId.toString(),
        type: "BIDDING_DEADLINE_PASSED",
        message: `Bidding deadline for shipment ${s.shipmentRef} has passed. Review bids and assign a carrier.`,
        shipmentId: s._id.toString(),
        metadata: { biddingDeadline: s.biddingDeadline.toISOString() },
      })
    )
  );

  console.log(`#3 processed ${shipments.length} shipments`);
};