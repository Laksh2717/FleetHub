import express from "express";
import { createPaymentOrder, razorpayWebhook } from "../../controllers/payment/payment.controllers.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Webhook route (no auth required - verified by signature)
// NOTE: Raw body parsing is handled at app.js level (before express.json())
router.route("/webhook").post(razorpayWebhook);

// Protected routes (require JWT)
router.use(verifyJWT);
router.route("/create-order").post(createPaymentOrder);

export default router;