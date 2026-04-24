import express from "express";
import { getProfile, updateProfile, deleteProfile } from "../../controllers/carrier/carrier.profile.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").get(getProfile);
router.route("/").put(updateProfile);
router.route("/").delete(deleteProfile);

export default router;