import mongoose, { Schema } from "mongoose";

const bidSchema = new Schema(
  {
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
      index: true,
    },
    carrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
      index: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedTransitHours: {
      type: Number,
      required: true,
      min: 1, // Changed from 0 - at least 1 hour makes sense
    },
    proposedVehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      enum: ["shipment expired", "shipper cancelled", "you cancelled"],
      default: null,
    },
    statusChangedOn: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Carrier can have only ONE pending bid per shipment
bidSchema.index(
  { shipmentId: 1, carrierId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  }
);

// Efficient query for getting bids for a shipment
bidSchema.index({ shipmentId: 1, status: 1, bidAmount: 1 });

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;