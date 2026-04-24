
import mongoose from 'mongoose';
import getISTDateUTC from './getISTDateUTC.js';

const currentYear = new Date().getFullYear();
const twoYearsAgo = getISTDateUTC(currentYear - 2, 9, 1, 0, 1); // 1st Sept, 00:01 IST

export const shipperSeed = [
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439010'),
    ownerName: 'John Doe',
    companyName: 'ABC Logistics',
    email: 'shipper@example.com',
    phone: '1234567890',
    password: '$2b$10$MWwqqaXhqfRriRFI83ADc.K/D2Q16vn6kFiDjUCa2RhHlpE9BJOvi',
    address: {
      street: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    gstNumber: '22AAAAA0000A1Z5',
    createdAt: twoYearsAgo
  }
];