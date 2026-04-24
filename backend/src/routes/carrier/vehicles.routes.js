import express from "express";
import { getVehicles, addVehicle, getVehicleDetails, deleteVehicle, retireVehicle, getAvailableVehiclesForBid } from "../../controllers/carrier/carrier.vehicles.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").get(getVehicles);
router.route("/").post(addVehicle);
router.route("/available-for-bid/:shipmentId").get(getAvailableVehiclesForBid);
router.route("/:vehicleId").get(getVehicleDetails);
router.route("/:vehicleId").delete(deleteVehicle);
router.route("/:vehicleId/retire").patch(retireVehicle);

export default router;