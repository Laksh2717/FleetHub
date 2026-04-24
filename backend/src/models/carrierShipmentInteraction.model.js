import mongoose, {Schema} from "mongoose";

const carrierShipmentInteractionSchema = new Schema(
  {
    carrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
      index: true,
    },
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["BIDDED", "NOT_INTERESTED"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One interaction per carrier-shipment pair
carrierShipmentInteractionSchema.index(
  { carrierId: 1, shipmentId: 1 },
  { unique: true }
);

const CarrierShipmentInteraction = mongoose.model(
  "CarrierShipmentInteraction",
  carrierShipmentInteractionSchema
);

export default CarrierShipmentInteraction;