import express from "express";
import {
  findShipments,
  findShipmentDetails,
  getActiveShipments,
  getActiveShipmentDetails,
  getCompletedShipments,
  getCompletedShipmentsDetails,
  getPendingPaymentShipments,
  getPendingPaymentShipmentDetails,
  markShipmentNotInterested,
  confirmPickup,
  confirmDelivery,
} from "../../controllers/carrier/carrier.shipments.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/findShipments").get(findShipments);
router.route("/findShipments/:shipmentId").get(findShipmentDetails);

router.route("/active").get(getActiveShipments);
router.route("/active/:shipmentId").get(getActiveShipmentDetails);

router.route("/completed").get(getCompletedShipments);
router.route("/completed/:shipmentId").get(getCompletedShipmentsDetails);

router.route("/pending-payments").get(getPendingPaymentShipments);
router.route("/pending-payments/:shipmentId").get(getPendingPaymentShipmentDetails);

router.route("/:shipmentId/not-interested").post(markShipmentNotInterested);
router.route("/:shipmentId/confirm-pickup").post(confirmPickup);
router.route("/:shipmentId/confirm-delivery").post(confirmDelivery);

export default router;