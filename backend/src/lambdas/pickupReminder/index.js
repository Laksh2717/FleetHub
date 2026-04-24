import connectDB from "../shared/db.js";
import { sendNotification } from "../shared/notify.js";
import mongoose from "mongoose";

const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", new mongoose.Schema({
  shipperId: mongoose.Schema.Types.ObjectId,
  carrierId: mongoose.Schema.Types.ObjectId,
  status: String,
  pickupDate: Date,
  shipmentRef: String,
  pickupLocation: mongoose.Schema.Types.Mixed,
}));

export const handler = async () => {
  await connectDB();

  const now = new Date();
  const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23hrs = new Date(now.getTime() + 23 * 60 * 60 * 1000);

  const shipments = await Shipment.find({
    status: "ASSIGNED",
    pickupDate: { $gte: in23hrs, $lte: in24hrs },
  });

  await Promise.all(
    shipments.map(async (s) => {
      // remind shipper
      await sendNotification({
        userId: s.shipperId.toString(),
        type: "PICKUP_REMINDER",
        message: `Pickup for shipment ${s.shipmentRef} is scheduled in less than 24 hours.`,
        shipmentId: s._id.toString(),
        metadata: { pickupDate: s.pickupDate, pickupLocation: s.pickupLocation },
      });

      // remind carrier
      await sendNotification({
        userId: s.carrierId.toString(),
        type: "PICKUP_REMINDER",
        message: `You have a pickup for shipment ${s.shipmentRef} in less than 24 hours.`,
        shipmentId: s._id.toString(),
        metadata: { pickupDate: s.pickupDate.toISOString(), pickupLocation: s.pickupLocation },
      });
    })
  );

  console.log(`#10 processed ${shipments.length} shipments`);
};