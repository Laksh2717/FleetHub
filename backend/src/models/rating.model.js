import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
  {
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
      unique: true, // One rating per shipment
      index: true,
    },
    raterShipperId: {
      type: Schema.Types.ObjectId,
      ref: "Shipper",
      required: true,
    },
    ratedCarrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
      index: true, // For fetching all ratings of a carrier
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;