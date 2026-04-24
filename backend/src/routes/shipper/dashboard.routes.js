import express from "express";
import { 
  getDashboard, 
  getShipmentCostTrendChart, 
  getShipmentStatusChart 
} from "../../controllers/shipper/shipper.dashboard.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").get(getDashboard);
router.route("/shipment-cost-trend").get(getShipmentCostTrendChart);
router.route("/shipment-status-chart").get(getShipmentStatusChart);

export default router;