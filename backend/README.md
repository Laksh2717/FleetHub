# FleetHub — Backend

A production-grade REST API built with **Node.js 22** and **Express 5**, powering a two-sided open freight bidding marketplace. The backend handles the complete shipment lifecycle — bidding engine, carrier assignment, pickup/delivery tracking, Razorpay payment processing, real-time SSE notifications, and scheduled Lambda jobs for automated lifecycle management.

---

## Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| **Node.js** | Runtime | 22 |
| **Express** | REST API framework | 5.x |
| **MongoDB Atlas** | Primary database — shipments, bids, payments, ratings | Latest |
| **Mongoose** | ODM with compound indexes and transactions | 9.x |
| **JWT (jsonwebtoken)** | Access + refresh token auth via HttpOnly cookies | 9.x |
| **Razorpay** | Payment processing (test mode) with webhook verification | 2.9.x |
| **AWS DynamoDB** | Notification storage — userId PK, notifId SK, 30-day TTL | v3 SDK |
| **AWS Lambda** | 8 scheduled notification handlers (Node.js 22, 256MB, 30s) | v3 SDK |
| **AWS EventBridge Scheduler** | Hourly cron triggers for all Lambda functions (IST timezone) | — |
| **Upstash Redis (ioredis)** | Shipment list caching with TTL-based invalidation | 5.x |
| **SSE (Server-Sent Events)** | Real-time push notifications to connected clients | Native |
| **bcrypt** | Password hashing (10 salt rounds) | 6.x |
| **cookie-parser** | HttpOnly cookie parsing for JWT tokens | 1.x |
| **Terraform** | Infrastructure as Code — Lambda, DynamoDB, EventBridge, IAM | — |
| **PM2** | Process management, auto-restart on crash | — |
| **Nginx + Certbot** | SSL termination | — |

---

## Project Structure

```
backend/
├── src/
│   ├── app.js                         
│   ├── index.js                       
│   │
│   ├── config/
│   │   ├── dynamodb.config.js         
│   │   ├── razorpay.config.js         
│   │   └── redis.config.js            
│   │
│   ├── constants/
│   │   └── notificationTypes.js       
│   │
│   ├── controllers/
│   │   ├── auth/
│   │   │   └── auth.controllers.js            
│   │   ├── shipper/
│   │   │   ├── shipper.shipments.controllers.js   
│   │   │   ├── shipper.dashboard.controllers.js   
│   │   │   └── shipper.profile.controllers.js     
│   │   ├── carrier/
│   │   │   ├── carrier.shipments.controllers.js   
│   │   │   ├── carrier.bids.controllers.js        
│   │   │   ├── carrier.dashboard.controllers.js   
│   │   │   ├── carrier.vehicles.controllers.js    
│   │   │   └── carrier.profile.controllers.js     
│   │   ├── notification/
│   │   │   └── notification.controllers.js    
│   │   └── payment/
│   │       └── payment.controllers.js         
│   │
│   ├── models/
│   │   ├── shipper.model.js           
│   │   ├── carrier.model.js           
│   │   ├── shipment.model.js          
│   │   ├── bid.model.js               
│   │   ├── vehicle.model.js           
│   │   ├── payment.model.js           
│   │   ├── rating.model.js            
│   │   └── carrierShipmentInteraction.model.js  
│   │
│   ├── routes/
│   │   ├── auth/auth.routes.js
│   │   ├── shipper/
│   │   │   ├── shipments.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── profile.routes.js
│   │   ├── carrier/
│   │   │   ├── shipments.routes.js
│   │   │   ├── bids.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── vehicles.routes.js
│   │   │   └── profile.routes.js
│   │   ├── notification/notification.routes.js
│   │   └── payment/payment.routes.js
│   │
│   ├── middlewares/
│   │   └── auth.middleware.js          
│   │
│   ├── utils/
│   │   ├── apiError.js                
│   │   ├── apiResponse.js             
│   │   ├── asyncHandler.js            
│   │   ├── tokenExpiry.js             
│   │   └── validations.js             
│   │
│   ├── lambdas/                       
│   │   ├── shared/
│   │   │   ├── db.js                  
│   │   │   └── notify.js             
│   │   ├── biddingDeadlineSoon/       
│   │   ├── biddingDeadlinePassed/     
│   │   ├── noAssignmentReminder/      
│   │   ├── expiryWarning/            
│   │   ├── shipmentExpired/          
│   │   ├── pickupReminder/           
│   │   ├── paymentReminder/          
│   │   └── ratingReminder/           
│   │
│   ├── seed/                          
│   │   ├── index.js                   
│   │   ├── shipper.seed.js
│   │   ├── carrier.seed.js
│   │   ├── vehicle.seed.js
│   │   ├── shipment.seed.js           
│   │   ├── bid.seed.js
│   │   ├── payment.seed.js
│   │   ├── rating.seed.js
│   │   ├── carrierShipmentInteraction.seed.js
│   │   └── getISTDateUTC.js
│   │
│   └── db/
│       └── index.js                   
│
├── package.json
├── .env.example
├── .gitignore
└── prettier.config.js
```

---

## Razorpay Payment Pipeline (Test Mode)

The payment system runs in **Razorpay test mode** — all transactions use test API keys and no real money moves. The entire flow is production-ready and switches to live by swapping keys.

```
Shipment status reaches DELIVERED
          ↓
Shipper clicks "Pay Now" → POST /payments/create-order
          ↓
Backend finds accepted bid amount, creates Razorpay Order
          ↓
Returns orderId + key to frontend → Razorpay Checkout opens
          ↓
User completes payment on Razorpay UI
          ↓
Razorpay fires webhook → POST /payments/webhook
          ↓
Backend verifies HMAC-SHA256 signature against raw body
          ↓
On "payment.captured" event:
  1. Payment record → status: COMPLETED, paidAt: now
  2. Shipment → paymentStatus: COMPLETED
  3. SSE notification → carrier (PAYMENT_RECEIVED with amount)
```

---

## SSE Notification System

Real-time notifications are delivered via **Server-Sent Events** — a persistent HTTP connection where the server pushes JSON payloads to connected browsers. No WebSocket library, no polling, no external pub/sub.

### How It Works

```
Client connects → GET /notifications/stream
                          ↓
Server sends handshake: { type: "CONNECTED" }
                          ↓
Registers userId → res object in in-memory Map
                          ↓
On any event (bid accepted, payment received, etc.):
  1. Write notification to DynamoDB (persistent)
  2. Look up userId in clients Map
  3. Push via res.write() → instant browser delivery
                          ↓
Client disconnects → cleanup from Map
```

### The 17 Notification Types

| Type | Trigger | Recipient |
|---|---|---|
| `FIRST_BID` | First bid placed on a shipment | Shipper |
| `BID_ACCEPTED` | Shipper accepts a carrier's bid | Carrier |
| `BID_REJECTED` | Shipper rejects a bid (or assigns another carrier) | Carrier |
| `SHIPMENT_EXPIRED_BID` | Shipment expires with pending bids | Carrier |
| `PICKUP_CONFIRMED` | Carrier confirms pickup | Shipper |
| `DELIVERY_CONFIRMED` | Carrier marks shipment delivered | Shipper |
| `PAYMENT_RECEIVED` | Razorpay webhook confirms payment capture | Carrier |
| `RATING_RECEIVED` | Shipper rates carrier after delivery | Carrier |
| `SHIPMENT_CANCELLED_BID` | Shipper cancels shipment with pending bids | Carrier |
| `BIDDING_DEADLINE_SOON` | Bidding deadline in < 24 hours (Lambda) | Shipper |
| `BIDDING_DEADLINE_PASSED` | Bidding deadline passed — time to review bids (Lambda) | Shipper |
| `NO_ASSIGNMENT_REMINDER` | Deadline passed, no carrier assigned yet (Lambda) | Shipper |
| `EXPIRY_WARNING` | Shipment nearing expiry date (Lambda) | Shipper |
| `SHIPMENT_EXPIRED` | Shipment expired — all pending bids cancelled (Lambda) | Shipper |
| `PICKUP_REMINDER` | Carrier hasn't confirmed pickup (Lambda) | Carrier |
| `PAYMENT_REMINDER` | Shipper hasn't paid after delivery (Lambda) | Shipper |
| `RATING_REMINDER` | Shipper hasn't rated carrier (Lambda) | Shipper |

---

## AWS Lambda Functions & EventBridge Schedules

Scheduled notifications are handled by **8 Lambda functions**, each triggered hourly by an **EventBridge Scheduler** rule (`cron(0 * * * ? *)`, IST timezone). Lambdas run independently of the Express server — they fire even if the server is down.

### Lambda Architecture

Each Lambda function follows the same pattern:

1. Connect to MongoDB Atlas (warm connection reuse via singleton)
2. Query for shipments matching the trigger condition
3. Write notification to **DynamoDB** (persistent storage)
4. Call Express **SSE bridge** endpoint (`POST /notifications/internal/push`) for instant delivery

```
EventBridge (hourly, IST) → Lambda
                                ↓
                     Connect to MongoDB (warm)
                                ↓
               Query shipments matching criteria
                                ↓
              DynamoDB PutCommand (write notification)
                                ↓
         POST /notifications/internal/push (SSE bridge)
                └─ Express looks up userId in clients Map → SSE push
```

The SSE bridge call is **non-fatal** — if the Express server is down or the user is offline, the notification still exists in DynamoDB. The frontend fetches unread count on mount, so nothing is lost.

### The 8 Lambda Functions

| Function | Trigger Condition | Action |
|---|---|---|
| `biddingDeadlineSoon` | Deadline in 23–24 hours from now | Notify shipper |
| `biddingDeadlinePassed` | Deadline passed, status still CREATED | Notify shipper to review bids |
| `noAssignmentReminder` | Deadline passed, no carrier assigned | Remind shipper to assign |
| `expiryWarning` | Shipment nearing `expiresAt` | Warn shipper |
| `shipmentExpired` | `expiresAt ≤ NOW`, status CREATED | **Expire shipment** + cancel all pending bids + free vehicles (MongoDB transaction) |
| `pickupReminder` | Carrier assigned but no pickup confirmation | Remind carrier |
| `paymentReminder` | Shipment delivered, payment still PENDING | Remind shipper |
| `ratingReminder` | Shipment delivered + paid, not yet rated | Remind shipper |

> **Note:** `shipmentExpired` is more than a notification — it's a **state mutation Lambda** that atomically expires the shipment, cancels all pending bids, and frees tied vehicles within a MongoDB transaction. Notifications are sent *after* the transaction commits.

### Lambda → Express SSE Bridge Security

The internal push endpoint (`POST /api/v1/notifications/internal/push`) is **not** JWT-protected — Lambdas don't have user credentials. Instead, it's secured with a **shared secret** via the `x-internal-secret` header:

```js
const secret = req.headers["x-internal-secret"];
if (secret !== process.env.INTERNAL_SECRET) {
  return res.status(403).json({ error: "Forbidden" });
}
```

The same `INTERNAL_SECRET` is configured in both the Express `.env` and as a Lambda environment variable via Terraform.

---

## DynamoDB Notification Storage

Notifications are stored in DynamoDB — not MongoDB — because the access pattern is fundamentally different from core business data:

| Schema | Value |
|---|---|
| **Partition Key** | `userId` (String) |
| **Sort Key** | `notifId` (String — `timestamp#uuid` for natural ordering) |
| **TTL** | `ttl` (Number — Unix seconds, 30-day expiry) |
| **GSI** | `shipmentId-createdAt-index` (for shipment-scoped queries) |
| **Billing** | PAY_PER_REQUEST (no capacity planning needed) |

**Why DynamoDB instead of a MongoDB collection?**

- Notifications are write-heavy, append-only, and time-scoped — a perfect fit for DynamoDB's key-value model
- 30-day TTL auto-deletes old notifications with zero application code
- Lambda functions write directly without going through Express
- PAY_PER_REQUEST billing means zero cost when idle

---

## Redis Caching Strategy

The carrier browse page (`GET /carrier/shipments/findShipments`) is the most-hit endpoint — every carrier opens it on app load. The underlying query is an expensive aggregation joining shipments with shipper data.

**What's cached:** The full global list of open shipments (one Redis key — `shipments:all`). No per-carrier data.

**What's not cached:** Each carrier's bid history and not-interested list. These are small, fast queries that vary per carrier.

**After fetching from cache:**
1. Filter out shipments past their bidding deadline (handles stale TTL data)
2. Query MongoDB for this carrier's interactions (bids placed, not-interested)
3. Filter those out in memory
4. Sort and paginate

**Invalidation:** TTL is 1 hour. Manual invalidation only fires on shipment cancellation — a carrier seeing a new shipment 1 hour late on a 48-hour deadline loses nothing.

---

## Infrastructure as Code (Terraform)

All AWS resources are provisioned via Terraform in the `terraform/` directory. Before a demo: `terraform apply`. After: `terraform destroy`. Zero lingering costs.

```bash
cd terraform
terraform init
terraform apply    # Lambda × 8, DynamoDB, EventBridge × 8, IAM roles
terraform destroy  # full teardown
```

### What Gets Provisioned

| Resource | Count | Configuration |
|---|---|---|
| `aws_lambda_function` | 8 | Node.js 22, 256MB RAM, 30s timeout |
| `aws_scheduler_schedule` | 8 | `cron(0 * * * ? *)`, IST timezone |
| `aws_dynamodb_table` | 1 | PAY_PER_REQUEST, userId PK, notifId SK, 30-day TTL |
| `aws_iam_role` | 2 | Lambda execution role + EventBridge scheduler role |

All 8 Lambda functions are managed as a **map** — one `for_each` resource block handles all of them. Same pattern for EventBridge schedules. No copy-paste, no drift.

---

## Authentication & Authorization

### Dual-Collection Auth

Shippers and carriers are separate MongoDB collections with separate Mongoose models — not a single `users` collection with a role field. Each model has its own:

- `pre("save")` hook for bcrypt password hashing (10 salt rounds)
- `generateAccessToken()` — JWT with `_id`, `companyName`, `email`, `gstNumber`, `role`
- `generateRefreshToken()` — JWT with `_id`, `role`

Login supports both **email** and **GST number** as identifiers. The controller detects which one was provided by checking for `@` character.

### Token Strategy

| Token | Storage | Lifetime | Refresh |
|---|---|---|---|
| Access Token | HttpOnly cookie + response body | Configurable via env | Via `/auth/refresh-token` |
| Refresh Token | HttpOnly cookie + MongoDB `refreshToken` field | Configurable via env | Rotated on each refresh |

Both cookies are set with `httpOnly: true`, `secure: true`, `sameSite: "none"` for cross-origin deployment.

---

## MongoDB Transaction Usage

All multi-document mutations use **Mongoose sessions and transactions** to ensure atomicity:

- **Bid placement:** Validate shipment eligibility → check for existing bid → verify vehicle status/type → create bid → set vehicle to BIDDED — all in one transaction
- **Bid acceptance:** Accept selected bid → reject all other pending bids → assign carrier + vehicle to shipment → set vehicle to ASSIGNED — all in one transaction
- **Pickup confirmation:** Update shipment status to IN_TRANSIT → set vehicle to IN_TRANSIT — all in one transaction
- **Delivery confirmation:** Update shipment to DELIVERED → free vehicle (AVAILABLE) → create payment record — all in one transaction
- **Shipment expiry (Lambda):** Expire shipment → cancel all pending bids → free all tied vehicles — all in one transaction
- **Shipment cancellation:** Cancel shipment → cancel all pending bids → free all tied vehicles → handle assigned carrier cleanup — all in one transaction

---

## Vehicle Status Lifecycle

Vehicles go through a strict status state machine — controlled atomically within MongoDB transactions:

```
AVAILABLE  ──→  BIDDED  ──→  ASSIGNED  ──→  IN_TRANSIT  ──→  AVAILABLE
                  │                                              ↑
                  └──────────────────────────────────────────────┘
                       (bid cancelled/rejected)

```

| Status | Meaning |
|---|---|
| `AVAILABLE` | Free to bid on shipments |
| `BIDDED` | Tied to a pending bid — cannot bid elsewhere |
| `ASSIGNED` | Carrier has been assigned to a shipment but hasn't picked up |
| `IN_TRANSIT` | Vehicle is on the road |
| `RETIRED` | Temporarily removed from active fleet |

---

## API Endpoints

### Authentication (`/api/v1/auth`)
```
POST  /register          Register as shipper or carrier (role in body)
POST  /login             Login with email/GST + password + role → JWT tokens
POST  /logout            Clear tokens, null refresh token in DB  [AUTH]
POST  /refresh-token     Rotate access + refresh tokens
GET   /me                Get current authenticated user           [AUTH]
```

### Shipper — Shipments (`/api/v1/shipper/shipments`)  [AUTH]
```
POST  /                           Create shipment
GET   /unassigned                 List open/expired shipments (tab filter)
GET   /unassigned/:shipmentId     Shipment details with bid count
GET   /active                     List assigned + in-transit shipments
GET   /active/:shipmentId         Active shipment details with carrier info
GET   /history                    List delivered + completed shipments
GET   /history/:shipmentId        History details with payment + rating
GET   /pending-payments           List delivered shipments awaiting payment
GET   /pending-payments/:shipmentId   Payment details with bid amount
GET   /cancelled                  List cancelled shipments
GET   /cancelled/:shipmentId      Cancelled shipment details
GET   /:shipmentId/bids           Get all bids for a shipment
GET   /:shipmentId/bids/:bidId    Get specific bid details
POST  /:shipmentId/accept-bid     Accept a bid → reject all others atomically
POST  /:shipmentId/rate-carrier   Rate carrier (1-5) after completion
POST  /:shipmentId/cancel         Cancel shipment → free vehicles, cancel bids
```

### Shipper — Dashboard (`/api/v1/shipper/dashboard`)  [AUTH]
```
GET   /                       KPI cards (total shipments, active, pending payments, total spend)
GET   /shipment-cost-trend    Monthly spending trend chart data
GET   /shipment-status-chart  Status breakdown (pie chart data)
```

### Shipper — Profile (`/api/v1/shipper/profile`)  [AUTH]
```
GET   /            Get profile
GET   /address     Get address only
PUT   /            Update profile
DELETE /           Delete account
```

### Carrier — Shipments (`/api/v1/carrier/shipments`)  [AUTH]
```
GET   /findShipments              Browse open shipments (Redis-cached + per-carrier filtering)
GET   /findShipments/:shipmentId  Shipment details for bidding
GET   /active                     List assigned + in-transit shipments
GET   /active/:shipmentId         Active shipment details
GET   /completed                  List completed (delivered + paid) shipments
GET   /completed/:shipmentId      Completed shipment details
GET   /pending-payments           List delivered shipments awaiting shipper payment
GET   /pending-payments/:shipmentId  Pending payment details
POST  /:shipmentId/not-interested    Mark shipment as not interested (filters from browse)
POST  /:shipmentId/confirm-pickup    Confirm pickup → shipment IN_TRANSIT
POST  /:shipmentId/confirm-delivery  Confirm delivery → create payment record
```

### Carrier — Bids (`/api/v1/carrier/bids`)  [AUTH]
```
POST   /                  Place bid (amount, transit hours, vehicle)
GET    /my-bids           List own bids with status filter
GET    /my-bids/:bidId    Get pending bid details
DELETE /my-bids/:bidId    Cancel bid → free vehicle
```

### Carrier — Dashboard (`/api/v1/carrier/dashboard`)  [AUTH]
```
GET   /                      KPI cards (active bids, accepted, total earnings, deliveries)
GET   /shipment-status-chart Status breakdown chart data
GET   /earnings-trend        Monthly earnings trend chart data
```

### Carrier — Vehicles (`/api/v1/carrier/vehicles`)  [AUTH]
```
GET    /                              List all vehicles
POST   /                              Add vehicle
GET    /available-for-bid/:shipmentId  Get available vehicles matching shipment requirements
GET    /:vehicleId                     Get vehicle details
DELETE /:vehicleId                     Delete vehicle (only if AVAILABLE)
PATCH  /:vehicleId/retire             Retire vehicle permanently
```

### Carrier — Profile (`/api/v1/carrier/profile`)  [AUTH]
```
GET    /    Get profile
PUT    /    Update profile
DELETE /    Delete account
```

### Payments (`/api/v1/payments`)
```
POST  /create-order    Create Razorpay order for a delivered shipment   [AUTH]
POST  /webhook         Razorpay webhook — HMAC-SHA256 verified          [PUBLIC]
```

### Notifications (`/api/v1/notifications`)
```
GET   /stream              SSE stream — persistent connection          [AUTH via query]
POST  /internal/push       Lambda → Express SSE bridge                 [INTERNAL SECRET]
GET   /                    Fetch notifications from DynamoDB            [AUTH]
GET   /unread-count        Get unread notification count                [AUTH]
PATCH /read-all            Mark all notifications as read               [AUTH]
PATCH /:notifId/read       Mark single notification as read             [AUTH]
```

---

## Data Models

### shippers
| Field | Type | Notes |
|---|---|---|
| ownerName | String | Required, trimmed |
| companyName | String | Required, trimmed |
| email | String | Required, unique, lowercase |
| phone | String | Required, unique |
| password | String | bcrypt hashed (10 rounds) |
| address | Embedded | street, city, state, pincode |
| gstNumber | String | Required, unique |
| refreshToken | String | Rotated on each token refresh |

### carriers
| Field | Type | Notes |
|---|---|---|
| *(same as shipper, plus:)* | | |
| averageRating | Number | 0–5, updated on each rating |
| ratingCount | Number | Incremented on each rating |
| fleetSize | Number | Tracks total vehicles |

### shipments
| Field | Type | Notes |
|---|---|---|
| shipmentRef | String | Unique, uppercase (e.g. "SHP-001") |
| shipperId | ObjectId | FK → shippers |
| receiverCompanyName | String | Delivery destination company |
| product | String | What's being shipped |
| description | String | Optional, max 500 chars |
| budgetPrice | Number | Shipper's budget for the shipment |
| requiredVehicleTypes | [String] | Enum: TRAILER_FLATBED, OPEN_BODY, CLOSED_CONTAINER, TANKER, REFRIGERATED, LCV |
| totalWeightTons | Number | Cargo weight |
| totalVolumeLitres | Number | Cargo volume |
| pickupLocation | Embedded | street, city, state, pincode |
| deliveryLocation | Embedded | street, city, state, pincode |
| biddingDeadline | Date | After this, no new bids accepted |
| expiresAt | Date | Indexed — Lambda checks this for expiry |
| pickupDate | Date | Expected pickup |
| estimatedDeliveryDate | Date | Expected delivery |
| carrierId | ObjectId | FK → carriers, set on bid acceptance |
| vehicleId | ObjectId | FK → vehicles, set on bid acceptance |
| pickupConfirmedAt | Date | Set by carrier |
| deliveredAt | Date | Set by carrier |
| status | Enum | `CREATED → ASSIGNED → IN_TRANSIT → DELIVERED → EXPIRED → CANCELLED` |
| paymentStatus | Enum | `PENDING → COMPLETED` |
| isRated | Boolean | One rating per shipment |
| cancellationReason | String | Optional, max 500 chars |

### bids
| Field | Type | Notes |
|---|---|---|
| shipmentId | ObjectId | FK → shipments |
| carrierId | ObjectId | FK → carriers |
| bidAmount | Number | Carrier's proposed price |
| estimatedTransitHours | Number | Min 1 hour |
| proposedVehicleId | ObjectId | FK → vehicles |
| status | Enum | `PENDING → ACCEPTED → REJECTED → CANCELLED` |
| cancellationReason | Enum | `"shipment expired" \| "shipper cancelled" \| "you cancelled"` |
| statusChangedOn | Date | When status last changed |


### vehicles
| Field | Type | Notes |
|---|---|---|
| carrierId | ObjectId | FK → carriers |
| vehicleNumber | String | Unique, uppercase (e.g. "GJ05AB1234") |
| vehicleType | Enum | TRAILER_FLATBED, OPEN_BODY, CLOSED_CONTAINER, TANKER, REFRIGERATED, LCV |
| capacityTons | Number | Weight capacity |
| capacityLitres | Number | Volume capacity |
| manufacturingYear | Number | 1900 to current year + 1 |
| status | Enum | `AVAILABLE → BIDDED → ASSIGNED → IN_TRANSIT → RETIRED` |

### payments
| Field | Type | Notes |
|---|---|---|
| shipmentId | ObjectId | FK → shipments |
| shipperId | ObjectId | FK → shippers |
| carrierId | ObjectId | FK → carriers |
| amount | Number | Accepted bid amount |
| status | Enum | `PENDING → COMPLETED` |
| razorpayOrderId | String | From Razorpay order creation |
| razorpayPaymentId | String | From webhook `payment.captured` event |
| paidAt | Date | Set on successful payment capture |

### ratings
| Field | Type | Notes |
|---|---|---|
| shipmentId | ObjectId | Unique — one rating per shipment |
| raterShipperId | ObjectId | FK → shippers |
| ratedCarrierId | ObjectId | FK → carriers (indexed for carrier ratings lookup) |
| rating | Number | 1–5 |

### carrier_shipment_interactions
| Field | Type | Notes |
|---|---|---|
| carrierId | ObjectId | FK → carriers |
| shipmentId | ObjectId | FK → shipments |
| status | Enum | `BIDDED \| NOT_INTERESTED` |

**Unique compound index:** `{ carrierId, shipmentId }` — one interaction record per pair.

---

## Local Development

### Prerequisites
- Node.js 22
- MongoDB Atlas cluster (or local MongoDB)
- Upstash Redis instance (or local Redis)
- Razorpay test mode keys (from [Razorpay Dashboard](https://dashboard.razorpay.com))
- AWS credentials (for DynamoDB — or use local DynamoDB)

### Setup

```bash
cd backend
npm install
cp .env.example .env    # fill in your values
npm run dev             # starts with nodemon on port 8000
```

### Seed the Database

```bash
npm run seed
```

Populates three years of realistic data so the app looks like it has been running — not empty:
- 1 shipper, 5 carriers with vehicle fleets
- 23 shipments across every status (CREATED, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED)
- Full bid history — accepted, rejected, pending, cancelled
- Payment records linked to delivered shipments
- Carrier ratings with realistic scores

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `8000` |
| `CORS_ORIGIN` | Frontend origin for CORS | `http://localhost:5173` |
| `DB_NAME` | MongoDB database name | `fleethub` |
| `MONGODB_URL` | Full MongoDB connection string | `mongodb+srv://...` |
| `ACCESS_TOKEN_SECRET` | JWT access token signing secret | `your_secret` |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime | `1d` |
| `REFRESH_TOKEN_SECRET` | JWT refresh token signing secret | `your_secret` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime | `10d` |
| `RAZORPAY_KEY_ID` | Razorpay test/live key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | `your_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret | `your_secret` |
| `REDIS_URL` | Upstash Redis connection string | `rediss://...` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `your_secret` |
| `AWS_REGION` | AWS region for DynamoDB | `ap-south-1` |
| `DYNAMO_TABLE_NAME` | DynamoDB notifications table | `Notifications` |
| `INTERNAL_SECRET` | Shared secret for Lambda → Express bridge | `your_secret` |

---

## Related

- Frontend: [frontend/README.md](../frontend/README.md)
- Full architecture & deployment: [Root README](../README.md)
- Terraform infrastructure: [terraform/](../terraform/)
