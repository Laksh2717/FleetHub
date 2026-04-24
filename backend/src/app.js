import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import ApiError from "./utils/apiError.js";
import ApiResponse from "./utils/apiResponse.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use('/api/v1/payments/webhook', (req, res, next) => {
  console.log("[Webhook Middleware] Starting to capture raw body");
  let data = '';
  req.setEncoding('utf8');
  
  req.on('data', chunk => {
    console.log("[Webhook Middleware] Received chunk, length:", chunk.length);
    data += chunk;
  });
  
  req.on('end', () => {
    console.log("[Webhook Middleware] Body capture complete, total length:", data.length);
    req.rawBody = data;
    next();
  });
  
  req.on('error', (err) => {
    console.error('[Webhook Middleware] Error reading raw body:', err);
    next();
  });
});

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use((req, res, next) => {
  res.setHeader("X-Accel-Buffering", "no");
  next();
});

import authRoutes from "./routes/auth/auth.routes.js";
import paymentRoutes from "./routes/payment/payment.routes.js";
import shipperDashboardRoutes from "./routes/shipper/dashboard.routes.js";
import shipperProfileRoutes from "./routes/shipper/profile.routes.js";
import shipperShipmentRoutes from "./routes/shipper/shipments.routes.js";
import carrierBidRoutes from "./routes/carrier/bids.routes.js";
import carrierDashboardRoutes from "./routes/carrier/dashboard.routes.js";
import carrierProfileRoutes from "./routes/carrier/profile.routes.js";
import carrierShipmentRoutes from "./routes/carrier/shipments.routes.js";
import carrierVehicleRoutes from "./routes/carrier/vehicles.routes.js";
import notificationRoutes from "./routes/notification/notification.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/payments", paymentRoutes);

app.use("/api/v1/shipper/dashboard", shipperDashboardRoutes);
app.use("/api/v1/shipper/profile", shipperProfileRoutes);
app.use("/api/v1/shipper/shipments", shipperShipmentRoutes);

app.use("/api/v1/carrier/bids", carrierBidRoutes);
app.use("/api/v1/carrier/dashboard", carrierDashboardRoutes);
app.use("/api/v1/carrier/profile", carrierProfileRoutes);
app.use("/api/v1/carrier/shipments", carrierShipmentRoutes);
app.use("/api/v1/carrier/vehicles", carrierVehicleRoutes);

app.use("/api/v1/notifications", notificationRoutes);

// ========== ERROR HANDLING ==========

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const statusCode = err?.statusCode || 500;

  const payload = {
    name: err?.name,
    errors: err?.errors || [],
    stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
  };

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, payload, err?.message || "Internal Server Error"));
});

export default app;