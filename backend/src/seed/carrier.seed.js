import mongoose from 'mongoose';
import getISTDateUTC from './getISTDateUTC.js';

const currentYear = new Date().getFullYear();
const twoYearsAgo = getISTDateUTC(currentYear - 2, 9, 1, 0, 1); // 1st Sept, 00:01 IST

const DEFAULT_PASSWORD = '$2b$10$MWwqqaXhqfRriRFI83ADc.K/D2Q16vn6kFiDjUCa2RhHlpE9BJOvi';

const ids = [
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013',
  '507f1f77bcf86cd799439014',
  '507f1f77bcf86cd799439015',
];

const ownerNames = [
  'Alice Smith',
  'Bob Johnson',
  'Charlie Brown',
  'Diana Prince',
  'Eve Wilson',
];

const companyNames = [
  'FastTrack Carriers',
  'Reliable Transport',
  'Speedy Logistics',
  'Global Haulers',
  'Prime Movers',
];

const emails = [
  'carrier1@example.com',
  'carrier2@example.com',
  'carrier3@example.com',
  'carrier4@example.com',
  'carrier5@example.com',
];

const phones = [
  '1234567891',
  '1234567892',
  '1234567893',
  '1234567894',
  '1234567895',
];

const addresses = [
  { street: '456 Elm St',   city: 'Delhi',     state: 'Delhi',       pincode: '110001' },
  { street: '789 Oak St',   city: 'Bangalore', state: 'Karnataka',   pincode: '560001' },
  { street: '101 Pine St',  city: 'Chennai',   state: 'Tamil Nadu',  pincode: '600001' },
  { street: '202 Maple St', city: 'Kolkata',   state: 'West Bengal', pincode: '700001' },
  { street: '303 Cedar St', city: 'Pune',      state: 'Maharashtra', pincode: '411001' },
];

const gstNumbers = [
  '07AAAAA0000A1Z6',
  '29AAAAA0000A1Z7',
  '33AAAAA0000A1Z8',
  '19AAAAA0000A1Z9',
  '27AAAAA0000A1ZA',
];

const ratingCounts   = [10, 0, 0, 0, 0];
const averageRatings = [3.9, 0, 0, 0, 0];

export const carrierSeed = ids.map((id, i) => ({
  _id:           new mongoose.Types.ObjectId(id),
  ownerName:     ownerNames[i],
  companyName:   companyNames[i],
  email:         emails[i],
  phone:         phones[i],
  password:      DEFAULT_PASSWORD,
  address:       addresses[i],
  gstNumber:     gstNumbers[i],
  createdAt:     twoYearsAgo,
  ratingCount:   ratingCounts[i],
  averageRating: averageRatings[i],
  fleetSize:     i === 0 ? 5 : 2, 
}));