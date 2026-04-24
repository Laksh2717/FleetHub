# FleetHub 🚛

> *A shipper in Surat has 20 tons of steel that needs to reach Delhi by Friday. He posts it at 9 PM with a bidding deadline of Wednesday. By Tuesday morning, seven carriers have placed competitive bids — different prices, different vehicles, different transit times. He reviews them, picks the best fit, and assigns.*
>
> *The other six are automatically rejected. The chosen carrier gets notified instantly. He picks up Thursday, delivers Friday. Payment is released. The shipper rates the carrier.*
>
> *No broker. No phone calls. No WhatsApp negotiations. Just a platform that handles the entire freight lifecycle.*

---

## What This Is

FleetHub is a **two-sided open freight bidding marketplace**. Shippers post shipments with a budget and a bidding deadline. Carriers browse open shipments, place competitive bids, and compete on price and capability. The shipper picks one carrier and the rest are automatically handled. The platform then manages pickup, delivery, payment, and ratings — end-to-end.

This is not a demo app. It is a production-grade system with:

- **A real bidding engine** — competitive bids, atomic carrier assignment, vehicle state machine
- **Event-driven notifications** across two transport layers — SSE for instant, Lambda for scheduled
- **Redis caching** with intelligent TTL invalidation on the most-hit endpoint
- **Razorpay payment pipeline** (test mode) with HMAC-SHA256 webhook verification
- **Role-based dashboards** with real analytics — spending trends, earnings charts, status breakdowns
- **17 notification types** covering every state change across the full shipment lifecycle
- **Infrastructure as Code** — all AWS resources provisioned and tearable via Terraform

**Live Demo →** [fleethub-ebon.vercel.app](https://fleethub-ebon.vercel.app)

---

## The Bidding Flow

This is the heart of the platform — every shipment goes through a strict lifecycle:

```
Shipper creates shipment with budget, vehicle type, and bidding deadline
                                  ↓
            Carriers browse open shipments and place bids
                                  ↓
                       Bidding deadline passes
                                  ↓
            Shipper reviews all bids — picks the best carrier
                                  ↓
One carrier assigned → all others auto-rejected in a single transaction
                                  ↓
            Carrier confirms pickup → shipment goes IN_TRANSIT
                                  ↓
                        Carrier marks delivered
                                  ↓
                   Shipper pays via Razorpay (test mode)
                                  ↓
                        Shipper rates the carrier
```

**Edge cases handled:**
- Shipment auto-expires if shipper never assigns after bidding deadline — Lambda cron job expires the shipment, cancels all pending bids, and frees all tied vehicles in a single MongoDB transaction
- All pending bids rejected atomically when a carrier is assigned
- Vehicle status managed atomically — `AVAILABLE → BIDDED → ASSIGNED → IN_TRANSIT → AVAILABLE`
- Shipper can cancel a shipment only before assignment — all pending bids and vehicles freed automatically
- Carrier can cancel their bid before deadline and place a fresh one
- 17 notification types covering every state change — instant via SSE, scheduled via Lambda

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              FRONTEND — React + Vite (Vercel CDN)            │
│                                                              │
│                     SSE connection open                      │
│                   (real-time notifications)                  │
└──────────────────────────────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼──────────────────────────────┐
│                      EC2 + Nginx + PM2                       │
│                       Express.js API                         │
│                                                              │
│   MongoDB Atlas         Upstash Redis           DynamoDB     │
│   (core data)          (shipment cache)      (notifications) │
└──────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────▼───────────────────┐
              │           AWS SERVERLESS            │
              │                                     │
              │   EventBridge Scheduler (hourly)    │
              │                 ↓                   │
              │        8 Lambda Functions           │
              │                 ↓                   │
              │         DynamoDB (write)            │
              │                 ↓                   │
              │     Express SSE Bridge (push)       │
              └─────────────────────────────────────┘
              
              All AWS resources provisioned via Terraform
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 22 + Express | REST API, business logic, SSE stream |
| MongoDB Atlas | Primary database — shipments, bids, payments, ratings |
| Mongoose | ODM with compound indexes for efficient queries |
| JWT + HttpOnly Cookies | Auth with silent refresh via interceptor |
| Upstash Redis (ioredis) | Shipment list caching with TTL-based invalidation |
| Razorpay | Payment processing with webhook signature verification |
| PM2 | Process management, auto-restart on crash |
| Nginx + Certbot | Reverse proxy, SSL termination — avoids mixed content errors |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework |
| React Query (TanStack) | Server state, caching, background refetch |
| React Router v6 | Client-side routing with role-based protection |
| Axios | HTTP client with token refresh interceptor |
| EventSource API | Native SSE — no library needed |
| React Hot Toast | Notification toasts on SSE push |
| Recharts | Dashboard analytics — line trends, pie breakdowns |

### AWS Infrastructure
| Service | Purpose |
|---|---|
| EC2 | Backend server hosting |
| Lambda × 8 | Scheduled notification processing (Node.js 22, 256MB, 30s) |
| EventBridge Scheduler × 8 | Hourly Lambda triggers (cron expression, IST timezone) |
| DynamoDB | Notification storage — userId PK, notifId SK, 30-day TTL |
| IAM | Execution roles with least-privilege DynamoDB access |
| CloudWatch | Lambda execution logs, 7-day retention |

### Infrastructure as Code
| Tool | Purpose |
|---|---|
| Terraform | Provisions Lambda, DynamoDB, EventBridge, IAM — one command |

---

## The Notification System

This was the most architecturally interesting part of the project.

**The problem:** 17 different notification types. Some fire immediately when a user takes an action (bid accepted, payment received). Some fire on a schedule regardless of what any user is doing (deadline approaching, payment overdue).

**The decision:** Split by nature of the trigger, not by convenience.

**Instant notifications** live in Express — they're part of the request lifecycle. Adding Lambda would introduce a network hop, cold start latency, and an extra failure point for zero architectural benefit.

**Scheduled notifications** live in Lambda — they run independently of the Express server, fire even if the server is down, and are exactly what serverless compute is designed for.

### How the SSE Bridge Works

```
Lambda fires (EventBridge hourly trigger)
       ↓
Queries MongoDB for matching shipments
       ↓
Writes notification to DynamoDB (persistent)
       ↓
POST /api/notifications/internal/push  ← secured with shared secret
       ↓
Express looks up clients Map (userId → res object)
       ↓
Pushes via SSE to connected browser instantly
```

If the user is offline when Lambda fires — the notification is still in DynamoDB. The frontend fetches unread count on mount. Nothing is lost.

### The 17 Notification Types

| Type | Trigger | Transport |
|---|---|---|
| `FIRST_BID` | First bid placed on a shipment | **SSE** (instant) |
| `BID_ACCEPTED` | Shipper accepts a carrier's bid | **SSE** |
| `BID_REJECTED` | Shipper rejects a bid | **SSE** |
| `PICKUP_CONFIRMED` | Carrier confirms pickup | **SSE** |
| `DELIVERY_CONFIRMED` | Carrier marks delivered | **SSE** |
| `PAYMENT_RECEIVED` | Razorpay webhook confirms payment | **SSE** |
| `RATING_RECEIVED` | Shipper rates carrier | **SSE** |
| `SHIPMENT_CANCELLED_BID` | Shipper cancels shipment | **SSE** |
| `SHIPMENT_EXPIRED_BID` | Shipment expires with pending bids | **SSE** |
| `BIDDING_DEADLINE_SOON` | Deadline approaching (< 24h) | **Lambda**  |
| `BIDDING_DEADLINE_PASSED` | Deadline passed — review bids | **Lambda** |
| `NO_ASSIGNMENT_REMINDER` | No carrier assigned after deadline | **Lambda** |
| `EXPIRY_WARNING` | Shipment nearing expiry | **Lambda** |
| `SHIPMENT_EXPIRED` | Shipment expired + bids cancelled | **Lambda** |
| `PICKUP_REMINDER` | Carrier hasn't confirmed pickup | **Lambda** |
| `PAYMENT_REMINDER` | Shipper hasn't paid after delivery | **Lambda** |
| `RATING_REMINDER` | Shipper hasn't rated carrier | **Lambda** |

---

## The Caching Strategy

The carrier browse page is the most-hit endpoint — every carrier opens it on app load. The underlying query is an expensive aggregation joining shipments with shipper data, filtered to open shipments only.

**What's cached:** The full global list of open shipments (no carrier-specific data). One Redis key — `shipments:all`.

**What's not cached:** Each carrier's bid history and not-interested list. These are small, fast queries that vary per carrier.

**Why this split:** Caching per-carrier lists would mean hundreds of cache keys, most never invalidated correctly. Caching globally and filtering in the application layer gives the best of both — one warm cache key, correct per-carrier results, zero memory waste.

**After fetching from cache:**
1. Filter out shipments past their bidding deadline (handles stale TTL data)
2. Query MongoDB for this carrier's interactions (bids placed, not-interested)
3. Filter those out in memory
4. Sort and paginate in memory

**Invalidation:** TTL is 1 hour. New shipments with 1–2 day deadlines don't need immediate cache busting — a carrier seeing a new shipment 1 hour late on a 48-hour deadline loses nothing. Manual invalidation only fires on shipment cancellation, where showing a dead listing could cause a carrier to bid on something that no longer exists.

Search and filter requests bypass cache entirely — those queries are unique enough that caching them would be memory waste with near-zero hit rate.

---

## The Payment Flow

Payments use **Razorpay in test mode** — the full pipeline is production-ready and switches to live by swapping API keys.

```
Shipment delivered → shipper clicks "Pay Now"
                           ↓
        Backend creates Razorpay Order (INR)
                           ↓
  Frontend opens Razorpay Checkout modal (dynamic script loading)
                           ↓
          User completes payment on Razorpay UI
                           ↓
   Razorpay fires webhook → backend verifies HMAC-SHA256 signature
                           ↓
      Payment marked COMPLETED → carrier notified via SSE
```

---

## Infrastructure as Code

### Terraform (AWS Provisioning)

All AWS resources are provisioned via Terraform. Before a demo: `terraform apply`. After: `terraform destroy`. Zero lingering costs.

```bash
cd terraform
terraform init
terraform apply   # Lambda × 8, DynamoDB, EventBridge × 8, IAM roles
terraform destroy # full teardown
```

The 8 Lambda functions are managed as a map — one resource block handles all of them:

```hcl
resource "aws_lambda_function" "fleethub" {
  for_each      = local.lambda_functions
  function_name = "fleethub-${each.key}"
  handler       = each.value.handler
  runtime       = "nodejs22.x"
  timeout       = 30
  memory_size   = 256
  ...
}
```

Same pattern for EventBridge schedules — 8 schedules from one resource block. No copy-paste. No drift.

---

## Dashboards

Both roles get analytics dashboards with real numbers — not placeholders.

**Shipper dashboard:** Total shipments created, active shipments, pending payments, total spend. Monthly spending trend (line chart). Shipment status breakdown (pie chart).

**Carrier dashboard:** Active bids, accepted bids, total earnings, deliveries completed. Monthly earnings trend (line chart). Shipment status breakdown (pie chart).

All charts built with **Recharts** — responsive, interactive, and pulling live data from aggregation endpoints.

---

## Project Structure

```
fleethub/
├── frontend/                        # React 19 + Vite 7 (Vercel)
│   └── src/
│       ├── components/              
│       ├── pages/                   
│       ├── hooks/                   
│       ├── services/                
│       ├── lib/                 
│       ├── routes/                  
│       └── utils/                   
│
├── backend/                         # Express 5 (EC2 + PM2)
│   └── src/
│       ├── controllers/             
│       ├── models/                  
│       ├── routes/                  
│       ├── middlewares/             
│       ├── config/    
│       ├── constants/
│       ├── seed/              
│       ├── utils/                   
│       └── lambda/                  # Lambda source (deployed separately)
│           ├── shared/              
│           ├── biddingDeadlineSoon/
│           ├── biddingDeadlinePassed/
│           ├── noAssignmentReminder/
│           ├── expiryWarning/
│           ├── shipmentExpired/
│           ├── pickupReminder/
│           ├── paymentReminder/
│           └── ratingReminder/
│
├── terraform/                       # AWS infrastructure as code
│   ├── dynamodb.tf
│   ├── lambda.tf
│   ├── eventbridge.tf
│   ├── iam.tf
│   ├── variables.tf
│   └── outputs.tf
│
└── README.md
```

---

## Running Locally

```bash
git clone https://github.com/Laksh2717/FleetHub.git

# Backend
cd FleetHub/backend
npm install
cp .env.example .env    # fill in your values
npm run dev

# Frontend (separate terminal)
cd FleetHub/frontend
npm install
cp .env.example .env    # fill in your values
npm run dev

# Seed the database
cd FleetHub/backend
npm run seed
```

---

## Environment Variables

### Backend `.env.example`
```env
PORT=8000
DB_NAME=
MONGODB_URL=
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_EXPIRY=

REDIS_URL=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
DYNAMO_TABLE_NAME=Notifications
INTERNAL_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### Frontend `.env.example`
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ACCESS_TOKEN_EXPIRY=
VITE_REFRESH_TOKEN_EXPIRY=
VITE_USER_STORAGE_KEY=
VITE_TOKEN_EXPIRY_KEY=
```

---

## The Demo Data

The seed populates three years of realistic history so the app looks like it has been running — not empty:

- **2 roles:** 1 shipper, 5 carriers — each with their own vehicle fleets
- **23 shipments** spanning three years — every status represented: CREATED, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
- **Full bid history** for every shipment — accepted, rejected, pending, cancelled
- **Completed payment records** linked to delivered shipments
- **Carrier ratings** with realistic scores
- **Current year shipments** in different statuses so every page of both dashboards has real data to show

---

## Detailed Documentation

| Module | README |
|---|---|
| **Backend** | [backend/README.md](backend/README.md) — API endpoints, data models, Razorpay flow, SSE system, Lambda functions, DynamoDB schema, Redis strategy, MongoDB transactions |
| **Frontend** | [frontend/README.md](frontend/README.md) — Component architecture, hooks, Axios interceptor, SSE client, Razorpay Checkout, routing, React Query patterns, validation |

---

## About

Built by **[Laksh Chovatiya](https://github.com/Laksh2717)**.

Every decision in this project was questioned — why Redis and not just MongoDB, why SSE and not polling, why Lambda only for scheduled jobs and not instant ones too, why DynamoDB and not a notifications collection in MongoDB. The answers are in the architecture sections above.

Half-built systems teach you nothing. The interesting part is always in the edge cases and the tradeoffs.

**[LinkedIn](https://www.linkedin.com/in/laksh-chovatiya-9b824131b/)**