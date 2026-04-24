import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const shipmentSchema = new Schema(
  {
    shipmentRef: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    shipperId: {
      type: Schema.Types.ObjectId,
      ref: "Shipper",
      required: true,
      index: true,
    },
    receiverCompanyName: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    budgetPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    requiredVehicleTypes: {
      type: [String],
      required: true,
      enum: [
        "TRAILER_FLATBED",
        "OPEN_BODY",
        "CLOSED_CONTAINER",
        "TANKER",
        "REFRIGERATED",
        "LCV",
      ],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: "At least one vehicle type is required"
      }
    },
    totalWeightTons: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalVolumeLitres: {
      type: Number,
      min: 0,
      default: 0,
    },
    pickupLocation: {
      type: addressSchema,
      required: true,
    },
    deliveryLocation: {
      type: addressSchema,
      required: true,
    },
    biddingDeadline: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    estimatedDeliveryDate: {
      type: Date,
      required: true,
    },
    carrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
      index: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    pickupConfirmedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["CREATED", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "EXPIRED", "CANCELLED"],
      default: "CREATED",
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },
    isRated: {
      type: Boolean,
      default: false,
      index: true
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
shipmentSchema.index({ status: 1, biddingDeadline: 1 });
shipmentSchema.index({ carrierId: 1, status: 1 });
shipmentSchema.index({ shipperId: 1, createdAt: -1 });

const Shipment = mongoose.model("Shipment", shipmentSchema);

export default Shipment;