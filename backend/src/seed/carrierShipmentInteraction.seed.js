
import mongoose from 'mongoose';
import getISTDateUTC from './getISTDateUTC.js';

const now         = new Date();
const currentYear = now.getFullYear();
const twoYearsAgo = currentYear - 2;
const prevYear    = currentYear - 1;

const CID = '507f1f77bcf86cd799439011'; // default carrier

const shipmentIds = [
  // historical twoYearsAgo
  '507f1f77bcf86cd799439026',
  '507f1f77bcf86cd799439027',
  '507f1f77bcf86cd799439028',
  '507f1f77bcf86cd799439029',
  // historical prevYear accepted
  '507f1f77bcf86cd799439042',
  '507f1f77bcf86cd799439043',
  '507f1f77bcf86cd799439044',
  '507f1f77bcf86cd799439045',
  '507f1f77bcf86cd799439046',
  '507f1f77bcf86cd799439047',
  '507f1f77bcf86cd799439048',
  '507f1f77bcf86cd799439049',
  '507f1f77bcf86cd799439050',
  '507f1f77bcf86cd799439051',
  // historical prevYear cancelled
  '507f1f77bcf86cd799439053',
  // current year — 5 bids for expired bidding shipment (shipment 3)
  '507f1f77bcf86cd799439056',
  '507f1f77bcf86cd799439056',
  '507f1f77bcf86cd799439056',
  '507f1f77bcf86cd799439056',
  '507f1f77bcf86cd799439056',
  // current year — assigned (4), in transit (5), pending payment (6), completed (7)
  '507f1f77bcf86cd799439057',
  '507f1f77bcf86cd799439058',
  '507f1f77bcf86cd799439059',
  '507f1f77bcf86cd799439099',
];

const carrierIds = [
  // historical — all default carrier
  ...Array(15).fill(CID),
  // current year — 5 different carriers for expired bidding shipment
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013',
  '507f1f77bcf86cd799439014',
  '507f1f77bcf86cd799439015',
  // current year — assigned, in transit, pending payment, completed
  CID, CID, CID, CID,
];

const createdAts = [
  // historical twoYearsAgo — 12th of each month
  getISTDateUTC(twoYearsAgo, 9, 12, 0, 1),
  getISTDateUTC(twoYearsAgo, 10, 12, 0, 1),
  getISTDateUTC(twoYearsAgo, 11, 12, 0, 1),
  getISTDateUTC(twoYearsAgo, 12, 12, 0, 1),
  // historical prevYear — 12th of each month
  getISTDateUTC(prevYear, 1, 12, 0, 1),
  getISTDateUTC(prevYear, 2, 12, 0, 1),
  getISTDateUTC(prevYear, 3, 12, 0, 1),
  getISTDateUTC(prevYear, 5, 12, 0, 1),
  getISTDateUTC(prevYear, 6, 12, 0, 1),
  getISTDateUTC(prevYear, 7, 12, 0, 1),
  getISTDateUTC(prevYear, 8, 12, 0, 1),
  getISTDateUTC(prevYear, 10, 12, 0, 1),
  getISTDateUTC(prevYear, 11, 12, 0, 1),
  getISTDateUTC(prevYear, 12, 12, 0, 1),
  // historical prevYear cancelled
  getISTDateUTC(prevYear, 9, 12, 0, 1),
  ...Array(9).fill(getISTDateUTC(currentYear, now.getMonth() + 1, 1, 0, 2)),
];

const ids = [
  '507f1f77bcf86cd799439034',
  '507f1f77bcf86cd799439035',
  '507f1f77bcf86cd799439036',
  '507f1f77bcf86cd799439037',
  '507f1f77bcf86cd799439062',
  '507f1f77bcf86cd799439063',
  '507f1f77bcf86cd799439064',
  '507f1f77bcf86cd799439065',
  '507f1f77bcf86cd799439066',
  '507f1f77bcf86cd799439067',
  '507f1f77bcf86cd799439068',
  '507f1f77bcf86cd799439069',
  '507f1f77bcf86cd799439070',
  '507f1f77bcf86cd799439071',
  '507f1f77bcf86cd799439072',
  '507f1f77bcf86cd799439073',
  '507f1f77bcf86cd799439074',
  '507f1f77bcf86cd799439075',
  '507f1f77bcf86cd799439076',
  '507f1f77bcf86cd799439077',
  '507f1f77bcf86cd799439078',
  '507f1f77bcf86cd799439079',
  '507f1f77bcf86cd799439080',
  '507f1f77bcf86cd799439101',
]

export const carrierShipmentInteractionSeed = shipmentIds.map((shipmentId, index) => ({
  _id: new mongoose.Types.ObjectId(ids[index]),
  carrierId: new mongoose.Types.ObjectId(carrierIds[index]),
  shipmentId: new mongoose.Types.ObjectId(shipmentIds[index]),
  status: 'BIDDED',
  createdAt: createdAts[index],
}));