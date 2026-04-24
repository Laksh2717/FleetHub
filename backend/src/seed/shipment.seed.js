import mongoose from 'mongoose';
import getISTDateUTC from './getISTDateUTC.js';

const receiverCompanies = [ 'Northwind Traders', 'Blue Sky Logistics', 'Evergreen Transport', 'Silverline Movers', 'Urban Haulage'];

const productList = [ 'Plastic Granules', 'Cotton Bales', 'Ceramic Tiles', 'Jute Bags', 'Copper Wire'];

const generalDescriptions = [
  'Handle with care',
  'Urgent delivery required',
  'Fragile items inside',
  'Keep dry during transit',
  'Stack upright only',
];

function getRandomWeight() {
  return Math.floor(Math.random() * 11) + 10; // 10 to 20 tons
}

const commonStreets = [ 'Maple Lane', 'Oakwood Drive', 'Sunset Avenue', 'Willow Street', 'Cedar Road'];
const uncommonCities = [ 'Chikhaldara', 'Kanker', 'Banswara', 'Kiphire', 'Daporijo'];
const states = ['Chhattisgarh', 'Nagaland', 'Arunachal Pradesh', 'Tripura', 'Jharkhand'];
const pincodes = ['492112','797001', '791122', '799101', '834002'];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAddress() {
  return {
    street: getRandom(commonStreets),
    city: getRandom(uncommonCities),
    state: getRandom(states),
    pincode: getRandom(pincodes),
  };
}

// Time helpers 
const now          = new Date();
const currentYear  = now.getFullYear();
const twoYearsAgo  = currentYear - 2;
const prevYear     = currentYear - 1;




const addDays = (date, d) =>
  new Date(date.getTime() + d * 24 * 60 * 60 * 1000);

const SID = '507f1f77bcf86cd799439010'; // default shipper
const CID = '507f1f77bcf86cd799439011'; // default carrier
const VID = '507f1f77bcf86cd799439016'; // default vehicle
const BDG = 50000;
const VT  = ['OPEN_BODY', 'LCV'];


const ids = [
  // current year (7)
  '507f1f77bcf86cd799439054',
  '507f1f77bcf86cd799439055',
  '507f1f77bcf86cd799439056',
  '507f1f77bcf86cd799439057',
  '507f1f77bcf86cd799439058',
  '507f1f77bcf86cd799439059',
  '507f1f77bcf86cd799439099',
  // historical (16)
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
  '507f1f77bcf86cd799439052',
  '507f1f77bcf86cd799439053',
];

// biddingDeadline per shipment
const biddingDeadlines = [
  // current year
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 1, 0, 1), // tomorrow 12:01
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 3, 0, 1), // 3 days later 12:01
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 3), // today 00:03
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 3),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 3),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 3),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 3),
  // historical — 13th of each month
  getISTDateUTC(twoYearsAgo, 9, 13, 0, 1),
  getISTDateUTC(twoYearsAgo, 10, 13, 0, 1),
  getISTDateUTC(twoYearsAgo, 11, 13, 0, 1),
  getISTDateUTC(twoYearsAgo, 12, 13, 0, 1),
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
  getISTDateUTC(prevYear, 4, 13, 0, 1),
  getISTDateUTC(prevYear, 9, 13, 0, 1),
];

const pickupDates = [
  // current year
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 3, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 5, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 3, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 1, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 5),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 5),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 5),
  // historical — 17th of each month
  getISTDateUTC(twoYearsAgo, 9, 17, 0, 1),
  getISTDateUTC(twoYearsAgo, 10, 17, 0, 1),
  getISTDateUTC(twoYearsAgo, 11, 17, 0, 1),
  getISTDateUTC(twoYearsAgo, 12, 17, 0, 1),
  getISTDateUTC(prevYear, 1, 17, 0, 1),
  getISTDateUTC(prevYear, 2, 17, 0, 1),
  getISTDateUTC(prevYear, 3, 17, 0, 1),
  getISTDateUTC(prevYear, 5, 17, 0, 1),
  getISTDateUTC(prevYear, 6, 17, 0, 1),
  getISTDateUTC(prevYear, 7, 17, 0, 1),
  getISTDateUTC(prevYear, 8, 17, 0, 1),
  getISTDateUTC(prevYear, 10, 17, 0, 1),
  getISTDateUTC(prevYear, 11, 17, 0, 1),
  getISTDateUTC(prevYear, 12, 17, 0, 1),
  getISTDateUTC(prevYear, 4, 17, 0, 1),
  getISTDateUTC(prevYear, 9, 17, 0, 1),
];

const estimatedDeliveryDates = [
  // current year
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 7, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 10, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 7, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 5, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate() + 5, 0, 1),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 2, 10),
  getISTDateUTC(now.getFullYear(), now.getMonth() + 1, now.getDate(), 2, 10),
  // historical — 25th of each month
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
  getISTDateUTC(prevYear, 4, 25, 0, 1),
  getISTDateUTC(prevYear, 9, 25, 0, 1),
];

const carrierIds = [
  // current year
  null, null, null,
  CID, CID, CID, CID,
  // historical — first 14 delivered, last 2 cancelled
  ...Array(14).fill(CID), null, null,
];

const vehicleIds = [
  // current year
  null, null, null,
  '507f1f77bcf86cd799439026',
  '507f1f77bcf86cd799439027',
  '507f1f77bcf86cd799439028',
  '507f1f77bcf86cd799439017',
  // historical
  ...Array(14).fill(VID), null, null,
];

const statuses = [
  // current year
  'CREATED', 'CREATED', 'CREATED',
  'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'DELIVERED',
  // historical
  ...Array(14).fill('DELIVERED'), 'CANCELLED', 'CANCELLED',
];

const paymentStatuses = [
  // current year
  'PENDING', 'PENDING', 'PENDING',
  'PENDING', 'PENDING', 'PENDING', 'COMPLETED',
  // historical
  ...Array(14).fill('COMPLETED'), 'PENDING', 'PENDING',
];

const isRated = [
  // current year
  false, false, false, false, false, false, false,
  // historical — first 4 twoYearsAgo unrated, next 10 prevYear rated, last 2 cancelled
  false, false, false, false,
  true, true, true, true, true, true, true, true, true, true,
  false, false,
];

const createdAts = [
  // current year — all 1st of month
  ...Array(7).fill(getISTDateUTC(currentYear, now.getMonth() + 1, now.getDate(), 0, 1)),
  // historical — 9th of each month
  getISTDateUTC(twoYearsAgo, 9, 9, 0, 1),
  getISTDateUTC(twoYearsAgo, 10, 9, 0, 1),
  getISTDateUTC(twoYearsAgo, 11, 9, 0, 1),
  getISTDateUTC(twoYearsAgo, 12, 9, 0, 1),
  getISTDateUTC(prevYear, 1, 9, 0, 1),
  getISTDateUTC(prevYear, 2, 9, 0, 1),
  getISTDateUTC(prevYear, 3, 9, 0, 1),
  getISTDateUTC(prevYear, 5, 9, 0, 1),
  getISTDateUTC(prevYear, 6, 9, 0, 1),
  getISTDateUTC(prevYear, 7, 9, 0, 1),
  getISTDateUTC(prevYear, 8, 9, 0, 1),
  getISTDateUTC(prevYear, 10, 9, 0, 1),
  getISTDateUTC(prevYear, 11, 9, 0, 1),
  getISTDateUTC(prevYear, 12, 9, 0, 1),
  getISTDateUTC(prevYear, 4, 9, 0, 1),
  getISTDateUTC(prevYear, 9, 9, 0, 1),
];

const cancellationReasons = [
  // current year — none
  ...Array(7).fill(null),
  // historical — first 14 none, last 2 cancelled
  ...Array(14).fill(null),
  'Shipper cancelled before bidding deadline',
  'Shipper cancelled after bid received',
];

const cancelledAts = [
  // current year — none
  ...Array(7).fill(null),
  // historical
  ...Array(14).fill(null),
  getISTDateUTC(prevYear, 4, 12, 0, 1),
  getISTDateUTC(prevYear, 9, 14, 0, 1),
];

// ─── Generator ────────────────────────────────────────────────────────────────
export const shipmentSeed = ids.map((id, i) => {
  const deadline = biddingDeadlines[i];

  const shipment = {
    _id:                  new mongoose.Types.ObjectId(id),
    shipmentRef:          `SHIP-${id.slice(-4)}`,
    shipperId:            new mongoose.Types.ObjectId(SID),
    receiverCompanyName:  getRandom(receiverCompanies),
    product:              getRandom(productList),
    description:          getRandom(generalDescriptions),
    budgetPrice:          BDG,
    requiredVehicleTypes: VT,
    totalWeightTons:      getRandomWeight(),
    totalVolumeLitres:    0,
    pickupLocation:       generateAddress(),
    deliveryLocation:     generateAddress(),
    biddingDeadline:      deadline,
    expiresAt:            addDays(deadline, 2), // always deadline + 2 days
    pickupDate:           pickupDates[i],
    estimatedDeliveryDate:estimatedDeliveryDates[i],
    carrierId:            carrierIds[i]
                            ? new mongoose.Types.ObjectId(carrierIds[i])
                            : null,
    vehicleId:            vehicleIds[i]
                            ? new mongoose.Types.ObjectId(vehicleIds[i])
                            : null,
    pickupConfirmedAt:    statuses[i] === 'IN_TRANSIT' || statuses[i] === 'DELIVERED' ? pickupDates[i] : null,
    deliveredAt:          statuses[i] === 'DELIVERED' ? estimatedDeliveryDates[i] : null,
    status:               statuses[i],
    paymentStatus:        paymentStatuses[i],
    isRated:              isRated[i],
    createdAt:            createdAts[i],
  };

  if (cancellationReasons[i]) {
    shipment.cancellationReason = cancellationReasons[i];
    shipment.cancelledAt        = cancelledAts[i];
  }

  return shipment;
});