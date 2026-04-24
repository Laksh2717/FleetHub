import mongoose, {Schema} from "mongoose";

const vehicleSchema = new Schema(
  {
    carrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      required: true,
      enum: [
        "TRAILER_FLATBED",
        "OPEN_BODY",
        "CLOSED_CONTAINER",
        "TANKER",
        "REFRIGERATED",
        "LCV",
      ],
    },
    capacityTons: {
      type: Number,
      min: 0,
      default: 0,
    },
    capacityLitres: {
      type: Number,
      min: 0,
      default: 0,
    },
    manufacturingYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1, // Can't be in future
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "BIDDED", "ASSIGNED", "IN_TRANSIT", "RETIRED"],
      default: "AVAILABLE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Efficient queries
vehicleSchema.index({ carrierId: 1, status: 1 });
vehicleSchema.index({ vehicleType: 1, status: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;