import mongoose from 'mongoose';
import getISTDateUTC from './getISTDateUTC.js';

const currentYear = new Date().getFullYear();
const twoYearsAgo = getISTDateUTC(currentYear - 2, 9, 1, 0, 1);

const ids = [
  '507f1f77bcf86cd799439016',
  '507f1f77bcf86cd799439017',
  '507f1f77bcf86cd799439018',
  '507f1f77bcf86cd799439019',
  '507f1f77bcf86cd799439020',
  '507f1f77bcf86cd799439021',
  '507f1f77bcf86cd799439022',
  '507f1f77bcf86cd799439023',
  '507f1f77bcf86cd799439024',
  '507f1f77bcf86cd799439025',
  '507f1f77bcf86cd799439026',
  '507f1f77bcf86cd799439027',
  '507f1f77bcf86cd799439028',
];

const carrierIds = [
  '507f1f77bcf86cd799439011', // carrier1
  '507f1f77bcf86cd799439011', // carrier1
  '507f1f77bcf86cd799439012', // carrier2
  '507f1f77bcf86cd799439012', // carrier2
  '507f1f77bcf86cd799439013', // carrier3
  '507f1f77bcf86cd799439013', // carrier3
  '507f1f77bcf86cd799439014', // carrier4
  '507f1f77bcf86cd799439014', // carrier4
  '507f1f77bcf86cd799439015', // carrier5
  '507f1f77bcf86cd799439015', // carrier5
  '507f1f77bcf86cd799439011', // carrier1 (additional)
  '507f1f77bcf86cd799439011', // carrier1 (additional)
  '507f1f77bcf86cd799439011', // carrier1 (additional)
];

const vehicleNumbers = [
  'MH01AB1234',
  'MH01CD5678',
  'KA01EF9012',
  'KA01GH3456',
  'TN01IJ7890',
  'TN01KL1234',
  'WB01MN5678',
  'WB01OP9012',
  'MH02QR3456',
  'MH02ST7890',
  'MH01EF9101',
  'MH01GH9102',
  'MH01IJ9103',
];

const statuses = [
  'BIDDED',
  'AVAILABLE',
  'AVAILABLE',
  'AVAILABLE',
  'AVAILABLE',
  'AVAILABLE',
  'AVAILABLE',
  'AVAILABLE',
  'AVAILABLE',
  'AVAILABLE',
  'ASSIGNED',
  'IN_TRANSIT',
  'AVAILABLE',
];

export const vehicleSeed = ids.map((id, i) => ({
  _id:               new mongoose.Types.ObjectId(id),
  carrierId:         new mongoose.Types.ObjectId(carrierIds[i]),
  vehicleNumber:     vehicleNumbers[i],
  vehicleType:       'OPEN_BODY',
  capacityTons:      20,
  capacityLitres:    0,
  manufacturingYear: 2021,
  status:            statuses[i],
  createdAt:         twoYearsAgo,
}));