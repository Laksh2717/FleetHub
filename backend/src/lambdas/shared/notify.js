import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE = process.env.DYNAMO_TABLE_NAME;

export const sendNotification = async ({
  userId,
  type,
  message,
  shipmentId,
  metadata = {},
}) => {
  const now = Date.now();
  const notifId = `${now}#${randomUUID()}`;
  const ttl = Math.floor(now / 1000) + 30 * 24 * 60 * 60;

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

  // write to DynamoDB
  await dynamoDB.send(new PutCommand({ TableName: TABLE, Item: item }));

  // call Express SSE bridge
  if (process.env.EXPRESS_URL) {
    const bridgeUrl = `${process.env.EXPRESS_URL}/api/v1/notifications/internal/push`;
    console.log("notify: sending internal SSE bridge request", { bridgeUrl, userId, notifId });
    try {
      const response = await fetch(bridgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SECRET,
        },
        body: JSON.stringify({ userId, notification: item }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        console.error(
          "SSE bridge returned non-ok status:",
          response.status,
          responseText
        );
      } else {
        console.log("notify: SSE bridge response ok", { status: response.status, body: responseText });
      }
    } catch (err) {
      console.error("SSE bridge call failed:", err.message);
      // non fatal — notification is already in DynamoDB
    }
  }

  return item;
};