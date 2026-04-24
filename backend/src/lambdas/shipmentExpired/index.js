import connectDB from "../shared/db.js";
import { sendNotification } from "../shared/notify.js";
import mongoose from "mongoose";

const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", new mongoose.Schema({
  shipperId: mongoose.Schema.Types.ObjectId,
  status: String,
  expiresAt: Date,
  shipmentRef: String,
}));

const Bid = mongoose.models.Bid || mongoose.model("Bid", new mongoose.Schema({
  shipmentId: mongoose.Schema.Types.ObjectId,
  carrierId: mongoose.Schema.Types.ObjectId,
  proposedVehicleId: mongoose.Schema.Types.ObjectId,
  status: String,
}));

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", new mongoose.Schema({
  carrierId: mongoose.Schema.Types.ObjectId,
  status: String,
}));

export const handler = async () => {
  await connectDB();

  const now = new Date();

  // find all shipments that should be expired
  const shipments = await Shipment.find({
    status: "CREATED",
    expiresAt: { $lte: now },
  });

  let processedCount = 0;

  for (const shipment of shipments) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // get pending bids
      const pendingBids = await Bid.find({
        shipmentId: shipment._id,
        status: "PENDING",
      }).session(session);

      // free vehicles and reject bids
      for (const bid of pendingBids) {
        const vehicle = await Vehicle.findOne({
          _id: bid.proposedVehicleId,
          carrierId: bid.carrierId,
        }).session(session);

        if (vehicle && vehicle.status === "BIDDED") {
          vehicle.status = "AVAILABLE";
          await vehicle.save({ session });
        }

        bid.status = "CANCELLED";
        bid.cancelledAt = new Date();
        bid.cancellationReason = "shipment expired";
        await bid.save({ session });
      }

      // expire the shipment
      shipment.status = "EXPIRED";
      await shipment.save({ session });

      await session.commitTransaction();
      session.endSession();

      // ===== NOTIFICATIONS (outside transaction) =====

      // notify shipper
      await sendNotification({
        userId: shipment.shipperId.toString(),
        type: "SHIPMENT_EXPIRED",
        message: `Your shipment ${shipment.shipmentRef} has expired with no carrier assigned.`,
        shipmentId: shipment._id.toString(),
        metadata: { expiresAt: shipment.expiresAt.toISOString() },
      });

      // notify each carrier who had pending bid
      await Promise.all(
        pendingBids.map((bid) =>
          sendNotification({
            userId: bid.carrierId.toString(),
            type: "SHIPMENT_EXPIRED_BID",
            message: `Shipment ${shipment.shipmentRef} you bid on has expired and is no longer available.`,
            shipmentId: shipment._id.toString(),
            metadata: { bidId: bid._id.toString() },
          })
        )
      );

      processedCount++;

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(`Failed to expire shipment ${shipment.shipmentRef}`, err);
    }
  }

  console.log(`Shipment expiry processed ${processedCount}/${shipments.length} shipments`);
};