import express from "express";
import { placeBid, getMyBids, getActiveBidDetails, deleteBid } from "../../controllers/carrier/carrier.bids.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").post(placeBid);
router.route("/my-bids").get(getMyBids);
router.route("/my-bids/:bidId").get(getActiveBidDetails).delete(deleteBid);

export default router;