import mongoose from 'mongoose';
import getISTDateUTC from './getISTDateUTC.js';

const currentYear = new Date().getFullYear();
const prevYear = currentYear - 1;

const shipmentIds = [
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
]

const ids = [
  '69ea4e424026529d59924d0c',
  '69ea4e424026529d59924d0d',
  '69ea4e424026529d59924d0e',
  '69ea4e424026529d59924d0f',
  '69ea4e424026529d59924d10',
  '69ea4e424026529d59924d11',
  '69ea4e424026529d59924d12',
  '69ea4e424026529d59924d13',
  '69ea4e424026529d59924d14',
  '69ea4e424026529d59924d15',
]

const rating = [5,4,4,5,4,5,4,5,4,3]

const createdAt = [
  getISTDateUTC(prevYear, 1, 28, 0, 1),
  getISTDateUTC(prevYear, 2, 28, 0, 1),
  getISTDateUTC(prevYear, 3, 28, 0, 1),
  getISTDateUTC(prevYear, 5, 28, 0, 1),
  getISTDateUTC(prevYear, 6, 28, 0, 1),
  getISTDateUTC(prevYear, 7, 28, 0, 1),
  getISTDateUTC(prevYear, 8, 28, 0, 1),
  getISTDateUTC(prevYear, 10, 28, 0, 1),
  getISTDateUTC(prevYear, 11, 28, 0, 1),
  getISTDateUTC(prevYear, 12, 28, 0, 1),
];

export const ratingSeed = shipmentIds.map((shipmentId, index) => ({
  _id: new mongoose.Types.ObjectId(ids[index]),
  shipmentId: new mongoose.Types.ObjectId(shipmentId),
  raterShipperId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439010'),
  ratedCarrierId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
  rating: rating[index],
  createdAt: createdAt[index]
}));