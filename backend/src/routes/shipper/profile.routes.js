import express from "express";
import { getProfile, getAddress, updateProfile, deleteProfile } from "../../controllers/shipper/shipper.profile.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").get(getProfile);
router.route("/address").get(getAddress);
router.route("/").put(updateProfile);
router.route("/").delete(deleteProfile);

export default router;