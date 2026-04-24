import express from "express";
import {
  createShipment,
  getUnassignedShipments,
  getUnassignedShipmentDetails,
  getActiveShipments,
  getActiveShipmentDetails,
  getShipmentHistory,
  getShipmentHistoryDetails,
  getPendingPaymentShipments,
  getPendingPaymentShipmentDetails,
  getOpenShipmentBids,
  getOpenShipmentBidDetails,
  acceptBid,
  rateCarrier,
  cancelShipment,
  getCancelledShipments,
  getCancelledShipmentDetails,
} from "../../controllers/shipper/shipper.shipments.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").post(createShipment);

router.route("/unassigned").get(getUnassignedShipments);
router.route("/unassigned/:shipmentId").get(getUnassignedShipmentDetails);

router.route("/active").get(getActiveShipments);
router.route("/active/:shipmentId").get(getActiveShipmentDetails);

router.route("/history").get(getShipmentHistory);
router.route("/history/:shipmentId").get(getShipmentHistoryDetails);

router.route("/pending-payments").get(getPendingPaymentShipments);
router.route("/pending-payments/:shipmentId").get(getPendingPaymentShipmentDetails);

router.route("/cancelled").get(getCancelledShipments);
router.route("/cancelled/:shipmentId").get(getCancelledShipmentDetails);

router.route("/:shipmentId/bids").get(getOpenShipmentBids);
router.route("/:shipmentId/bids/:bidId").get(getOpenShipmentBidDetails);

router.route("/:shipmentId/accept-bid").post(acceptBid);
router.route("/:shipmentId/rate-carrier").post(rateCarrier);
router.route("/:shipmentId/cancel").post(cancelShipment);

export default router;