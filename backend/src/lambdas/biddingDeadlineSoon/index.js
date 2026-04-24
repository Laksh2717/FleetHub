import connectDB from "../shared/db.js";
import { sendNotification } from "../shared/notify.js";
import mongoose from "mongoose";

// inline schema — lambdas don't import from your main app
const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", new mongoose.Schema({
  shipperId: mongoose.Schema.Types.ObjectId,
  status: String,
  biddingDeadline: Date,
  shipmentRef: String,
}));

export const handler = async () => {
  await connectDB();

  const now = new Date();
  const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23hrs = new Date(now.getTime() + 23 * 60 * 60 * 1000);

  // shipments whose bidding deadline falls in the next 23-24 hours
  const shipments = await Shipment.find({
    status: "CREATED",
    biddingDeadline: { $gte: in23hrs, $lte: in24hrs },
  });

  await Promise.all(
    shipments.map((s) =>
      sendNotification({
        userId: s.shipperId.toString(),
        type: "BIDDING_DEADLINE_SOON",
        message: `Your shipment ${s.shipmentRef} bidding deadline is in less than 24 hours.`,
        shipmentId: s._id.toString(),
        metadata: { biddingDeadline: s.biddingDeadline.toISOString() },
      })
    )
  );

  console.log(`#2 processed ${shipments.length} shipments`);
};