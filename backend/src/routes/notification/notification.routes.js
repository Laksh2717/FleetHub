import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
  streamNotifications,
  internalPush,
} from "../../controllers/notification/notification.controllers.js";
import {verifyJWT, verifyJWTFromQuery} from "../../middlewares/auth.middleware.js";

const router = express.Router();

// CORS preflight for SSE stream
router.options("/stream", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// SSE stream — must be before /:notifId/read to avoid route conflict
router.route("/stream").get(verifyJWTFromQuery, streamNotifications);

// Lambda internal bridge — no JWT, protected by internal secret
router.route("/internal/push").post(internalPush);

// standard routes
router.route("/").get(verifyJWT, getNotifications);
router.route("/unread-count").get(verifyJWT, getUnreadCount);
router.route("/read-all").patch(verifyJWT, markAllAsRead);
router.route("/:notifId/read").patch(verifyJWT, markOneAsRead);

export default router;