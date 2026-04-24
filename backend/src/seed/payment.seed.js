
import mongoose from 'mongoose';
import getISTDateUTC from './getISTDateUTC.js';

const now         = new Date();
const currentYear = now.getFullYear();
const twoYearsAgo = currentYear - 2;
const prevYear    = currentYear - 1;

const ids = [
  '507f1f77bcf86cd799439038',
  '507f1f77bcf86cd799439039',
  '507f1f77bcf86cd799439040',
  '507f1f77bcf86cd799439041',
  '507f1f77bcf86cd799439072',
  '507f1f77bcf86cd799439073',
  '507f1f77bcf86cd799439074',
  '507f1f77bcf86cd799439075',
  '507f1f77bcf86cd799439076',
  '507f1f77bcf86cd799439077',
  '507f1f77bcf86cd799439078',
  '507f1f77bcf86cd799439079',
  '507f1f77bcf86cd799439080',
  '507f1f77bcf86cd799439081',
  '507f1f77bcf86cd799439082',
  '507f1f77bcf86cd799439102',
]

const shipmentIds = [
  '507f1f77bcf86cd799439026',
  '507f1f77bcf86cd799439027',
  '507f1f77bcf86cd799439028',
  '507f1f77bcf86cd799439029',
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
  '507f1f77bcf86cd799439059',
  '507f1f77bcf86cd799439099',
]

const status = [...Array(14).fill('COMPLETED'), 'PENDING', 'COMPLETED']

const createdAt = [
  getISTDateUTC(twoYearsAgo, 9, 25, 0, 1),
  getISTDateUTC(twoYearsAgo, 10, 25, 0, 1),
  getISTDateUTC(twoYearsAgo, 11, 25, 0, 1),
  getISTDateUTC(twoYearsAgo, 12, 25, 0, 1),
  getISTDateUTC(prevYear, 1, 25, 0, 1),
  getISTDateUTC(prevYear, 2, 25, 0, 1),
  getISTDateUTC(prevYear, 3, 25, 0, 1),
  getISTDateUTC(prevYear, 5, 25, 0, 1),
  getISTDateUTC(prevYear, 6, 25, 0, 1),
  getISTDateUTC(prevYear, 7, 25, 0, 1),
  getISTDateUTC(prevYear, 8, 25, 0, 1),
  getISTDateUTC(prevYear, 10, 25, 0, 1),
  getISTDateUTC(prevYear, 11, 25, 0, 1),
  getISTDateUTC(prevYear, 12, 25, 0, 1),
  getISTDateUTC(currentYear, now.getMonth() + 1, now.getDate(), 2, 10),
  getISTDateUTC(currentYear, now.getMonth() + 1, now.getDate(), 2, 10),
];

const paidAt = [
  getISTDateUTC(twoYearsAgo, 9, 27, 0, 2),
  getISTDateUTC(twoYearsAgo, 10, 27, 0, 2),
  getISTDateUTC(twoYearsAgo, 11, 27, 0, 2),
  getISTDateUTC(twoYearsAgo, 12, 27, 0, 2),
  getISTDateUTC(prevYear, 1, 27, 0, 2),
  getISTDateUTC(prevYear, 2, 27, 0, 2),
  getISTDateUTC(prevYear, 3, 27, 0, 2),
  getISTDateUTC(prevYear, 5, 27, 0, 2),
  getISTDateUTC(prevYear, 6, 27, 0, 2),
  getISTDateUTC(prevYear, 7, 27, 0, 2),
  getISTDateUTC(prevYear, 8, 27, 0, 2),
  getISTDateUTC(prevYear, 10, 27, 0, 2),
  getISTDateUTC(prevYear, 11, 27, 0, 2),
  getISTDateUTC(prevYear, 12, 27, 0, 2),
  getISTDateUTC(currentYear, now.getMonth() + 1, now.getDate(), 2, 12),
  getISTDateUTC(currentYear, now.getMonth() + 1, now.getDate(), 2, 12),
];

export const paymentSeed = shipmentIds.map((shipmentId, index) => ({
  _id: new mongoose.Types.ObjectId(ids[index]),
  shipmentId: new mongoose.Types.ObjectId(shipmentId),
  shipperId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439010'),
  carrierId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
  amount: 49000,
  status: status[index],
  paidAt: paidAt[index],
  createdAt: createdAt[index]
}));
