import mongoose from 'mongoose';
import connectDB from '../db/index.js';
import Shipper from '../models/shipper.model.js';
import Carrier from '../models/carrier.model.js';
import Vehicle from '../models/vehicle.model.js';
import Shipment from '../models/shipment.model.js';
import Bid from '../models/bid.model.js';
import CarrierShipmentInteraction from '../models/carrierShipmentInteraction.model.js';
import Payment from '../models/payment.model.js';
import Rating from '../models/rating.model.js';
import { shipperSeed } from './shipper.seed.js';
import { carrierSeed } from './carrier.seed.js';
import { vehicleSeed } from './vehicle.seed.js';
import { shipmentSeed } from './shipment.seed.js';
import { bidSeed } from './bid.seed.js';
import { carrierShipmentInteractionSeed } from './carrierShipmentInteraction.seed.js';
import { paymentSeed } from './payment.seed.js';
import {ratingSeed} from './rating.seed.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Shipper.deleteMany({});
    await Carrier.deleteMany({});
    await Vehicle.deleteMany({});
    await Shipment.deleteMany({});
    await Bid.deleteMany({});
    await CarrierShipmentInteraction.deleteMany({});
    await Payment.deleteMany({});
    await Rating.deleteMany({});

    // Insert seed data
    await Shipper.insertMany(shipperSeed);
    await Carrier.insertMany(carrierSeed);
    await Vehicle.insertMany(vehicleSeed);
    await Shipment.insertMany(shipmentSeed);
    await Bid.insertMany(bidSeed);
    await CarrierShipmentInteraction.insertMany(carrierShipmentInteractionSeed);
    await Payment.insertMany(paymentSeed);
    await Rating.insertMany(ratingSeed);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();