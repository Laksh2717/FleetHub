import mongoose from 'mongoose';
import getISTDateUTC from './getISTDateUTC.js';

const now         = new Date();
const currentYear = now.getFullYear();
const twoYearsAgo = currentYear - 2;
const prevYear    = currentYear - 1;

const CID = '507f1f77bcf86cd799439011'; // default carrier
const VID = '507f1f77bcf86cd799439016'; // default vehicle

const ids = [
  // historical — twoYearsAgo (4)
  '507f1f77bcf86cd799439030',
  '507f1f77bcf86cd799439031',
  '507f1f77bcf86cd799439032',
  '507f1f77bcf86cd799439033',
  // historical — prevYear accepted (10)
  '507f1f77bcf86cd799439052',
  '507f1f77bcf86cd799439053',
  '507f1f77bcf86cd799439054',
  '507f1f77bcf86cd799439055',
  '507f1f77bcf86cd799439056',
  '507f1f77bcf86cd799439057',
  '507f1f77bcf86cd799439058',
  '507f1f77bcf86cd799439059',
  '507f1f77bcf86cd799439060',
  '507f1f77bcf86cd799439061',
  // historical — prevYear cancelled (1)
  '507f1f77bcf86cd799439062',
  // current year — 5 bids for expired bidding shipment
  '507f1f77bcf86cd799439063',
  '507f1f77bcf86cd799439064',
  '507f1f77bcf86cd799439065',
  '507f1f77bcf86cd799439066',
  '507f1f77bcf86cd799439067',
  // current year — assigned, in transit, pending payment, completed
  '507f1f77bcf86cd799439068',
  '507f1f77bcf86cd799439069',
  '507f1f77bcf86cd799439070',
  '507f1f77bcf86cd799439100',
];

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

const proposedVehicleIds = [
  // historical
  ...Array(15).fill(VID),
  // current year 5 bids — one per carrier's vehicle
  '507f1f77bcf86cd799439016',
  '507f1f77bcf86cd799439018',
  '507f1f77bcf86cd799439020',
  '507f1f77bcf86cd799439022',
  '507f1f77bcf86cd799439024',
  // current year last 4
  '507f1f77bcf86cd799439026',
  '507f1f77bcf86cd799439027',
  '507f1f77bcf86cd799439028',
  '507f1f77bcf86cd799439025',
];

const statuses = [
  // historical twoYearsAgo — all accepted
  ...Array(4).fill('ACCEPTED'),
  // historical prevYear accepted
  ...Array(10).fill('ACCEPTED'),
  // historical prevYear cancelled
  'CANCELLED',
  // current year 5 bids for expired bidding shipment — all pending
  ...Array(5).fill('PENDING'),
  // current year last 4 — all accepted
  ...Array(4).fill('ACCEPTED'),
];

// statusChangedOn
const statusChangedOns = [
  // historical twoYearsAgo — 13th of each month
  getISTDateUTC(twoYearsAgo, 9, 13, 0, 1),
  getISTDateUTC(twoYearsAgo, 10, 13, 0, 1),
  getISTDateUTC(twoYearsAgo, 11, 13, 0, 1),
  getISTDateUTC(twoYearsAgo, 12, 13, 0, 1),
  // historical prevYear accepted — 13th of each month
  getISTDateUTC(prevYear, 1, 13, 0, 1),
  getISTDateUTC(prevYear, 2, 13, 0, 1),
  getISTDateUTC(prevYear, 3, 13, 0, 1),
  getISTDateUTC(prevYear, 5, 13, 0, 1),
  getISTDateUTC(prevYear, 6, 13, 0, 1),
  getISTDateUTC(prevYear, 7, 13, 0, 1),
  getISTDateUTC(prevYear, 8, 13, 0, 1),
  getISTDateUTC(prevYear, 10, 13, 0, 1),
  getISTDateUTC(prevYear, 11, 13, 0, 1),
  getISTDateUTC(prevYear, 12, 13, 0, 1),
  // historical prevYear cancelled
  getISTDateUTC(prevYear, 9, 13, 0, 1),
  // current year 5 bids — pending so statusChangedOn = createdAt
  ...Array(5).fill(null),
  // current year last 4 — status changed at 1st of month 12:04
  ...Array(4).fill(getISTDateUTC(currentYear, now.getMonth() + 1, 1, 0, 4)),
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

// ─── Generator ────────────────────────────────────────────────────────────────
export const bidSeed = ids.map((id, i) => ({
  _id:                  new mongoose.Types.ObjectId(id),
  shipmentId:           new mongoose.Types.ObjectId(shipmentIds[i]),
  carrierId:            new mongoose.Types.ObjectId(carrierIds[i]),
  bidAmount:            49000,
  estimatedTransitHours:50,
  proposedVehicleId:    new mongoose.Types.ObjectId(proposedVehicleIds[i]),
  status:               statuses[i],
  statusChangedOn:      statusChangedOns[i],
  createdAt:            createdAts[i],
  cancelledAt:          statuses[i] === 'CANCELLED' ? getISTDateUTC(prevYear, 9, 14, 0, 1) : null,
  cancellationReason:   statuses[i] === 'CANCELLED' ? 'shipper cancelled' : null,
}));