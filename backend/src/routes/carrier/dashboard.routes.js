import express from "express";
import { getDashboard, getShipmentStatusChart, getEarningsTrendChart } from "../../controllers/carrier/carrier.dashboard.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").get(getDashboard);
router.route("/shipment-status-chart").get(getShipmentStatusChart);
router.route("/earnings-trend").get(getEarningsTrendChart);

export default router;