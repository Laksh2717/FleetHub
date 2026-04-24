import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import dynamoDB from "../../config/dynamodb.config.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";

const TABLE = process.env.DYNAMO_TABLE_NAME || "Notifications";

const clients = new Map(); // userId → res object

export const pushToSSE = (userId, notification) => {
  const client = clients.get(userId);
  if (!client) {
    console.warn("pushToSSE no client for userId", { userId, notifId: notification?.notifId });
    return;
  }

  try {
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  } catch (error) {
    console.error("pushToSSE write failed", { userId, notifId: notification?.notifId, message: error.message });
  }
};

export const sendNotification = async ({
  userId,
  type,
  message,
  shipmentId,
  metadata = {},
}) => {
  const now = Date.now();
  const notifId = `${now}#${randomUUID()}`;
  const ttl = Math.floor(now / 1000) + 30 * 24 * 60 * 60; // 30 days

  // Convert any Date objects in metadata to ISO strings for DynamoDB
  const processedMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value instanceof Date) {
      processedMetadata[key] = value.toISOString();
    } else {
      processedMetadata[key] = value;
    }
  }

  const item = {
    userId,
    notifId,
    type,
    message,
    shipmentId,
    metadata: processedMetadata,
    isRead: false,
    createdAt: now,
    ttl,
  };

  await dynamoDB.send(new PutCommand({ TableName: TABLE, Item: item }));

  // push via SSE instantly after DynamoDB write
  try {
    pushToSSE(userId, item);
  } catch (err) {
    console.error("SSE push failed:", err.message);
  }

  return item;
};

export const streamNotifications = (req, res) => {
  const userId = req.user._id.toString();

  // CORS headers for EventSource
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // send handshake so client knows connection is open
  res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

  // register this user
  clients.set(userId, res);
  console.log(`SSE connected: ${userId} | Total clients: ${clients.size}`);

  // cleanup on disconnect
  req.on("close", () => {
    clients.delete(userId);
    console.log(`SSE disconnected: ${userId} | Total clients: ${clients.size}`);
    console.log(`Close reason: ${res.writableEnded ? "response ended" : "client disconnected"}`);
  });
};

export const internalPush = (req, res) => {
  // verify internal secret
  const secret = req.headers["x-internal-secret"];
  if (secret !== process.env.INTERNAL_SECRET) {
    console.warn("internalPush forbidden: invalid secret");
    return res.status(403).json({ error: "Forbidden" });
  }

  const { userId, notification } = req.body;

  if (!userId || !notification) {
    console.warn("internalPush bad request: missing userId or notification", { body: req.body });
    return res.status(400).json({ error: "userId and notification required" });
  }

  const clientExists = clients.has(userId);
  console.log("internalPush", { userId, notifId: notification?.notifId, clientExists });

  pushToSSE(userId, notification);
  return res.status(200).json({ pushed: clientExists });
};

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const all = req.query.all === "true";
  const limit = all ? 500 : Math.min(parseInt(req.query.limit) || 15, 50);

  const result = await dynamoDB.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
    ScanIndexForward: false,
    Limit: limit,
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      notifications: result.Items ?? [],
      hasMore: !!result.LastEvaluatedKey,
    }, "Notifications fetched successfully")
  );
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const result = await dynamoDB.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "userId = :uid",
    FilterExpression: "isRead = :false",
    ExpressionAttributeValues: {
      ":uid": userId,
      ":false": false,
    },
    Select: "COUNT",
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      unreadCount: result.Count ?? 0,
    }, "Unread count fetched successfully")
  );
});

export const markOneAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { notifId } = req.params;

  if (!notifId) throw new ApiError(400, "notifId is required");

  const result = await dynamoDB.send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId, notifId },
    UpdateExpression: "SET isRead = :true",
    ExpressionAttributeValues: { ":true": true },
    ReturnValues: "ALL_NEW",
  }));

  if (!result.Attributes) throw new ApiError(404, "Notification not found");

  return res.status(200).json(
    new ApiResponse(200, {
      notification: result.Attributes,
    }, "Marked as read successfully")
  );
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const result = await dynamoDB.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "userId = :uid",
    FilterExpression: "isRead = :false",
    ExpressionAttributeValues: {
      ":uid": userId,
      ":false": false,
    },
  }));

  const unread = result.Items ?? [];

  if (unread.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, { markedCount: 0 }, "No unread notifications")
    );
  }

  await Promise.all(
    unread.map((item) =>
      dynamoDB.send(new UpdateCommand({
        TableName: TABLE,
        Key: { userId: item.userId, notifId: item.notifId },
        UpdateExpression: "SET isRead = :true",
        ExpressionAttributeValues: { ":true": true },
      }))
    )
  );

  return res.status(200).json(
    new ApiResponse(200, {
      markedCount: unread.length,
    }, "All notifications marked as read")
  );
});