# FleetHub — Frontend

A production-grade React SPA powering a two-sided freight bidding marketplace. The frontend provides role-based dashboards for shippers and carriers, real-time SSE notifications with toast alerts, Razorpay Checkout integration, interactive analytics charts, and a fully automated silent token refresh system — all deployed to **Vercel** as a static SPA.

---

## Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| **React** | UI framework | 19 |
| **Vite** | Build tool and dev server | 7.x |
| **React Compiler** | Auto-memoization via Babel plugin (zero manual `useMemo`/`useCallback` needed) | 1.x |
| **Tailwind CSS** | Utility-first styling via PostCSS integration | 4.x |
| **React Query (TanStack)** | Server state management — caching, background refetch, mutations | 5.x |
| **React Router** | Client-side routing with role-based protection | 7.x |
| **Axios** | HTTP client with response interceptor for silent token refresh | 1.x |
| **EventSource API** | Native SSE — real-time notification stream (no external library) | Native |
| **React Hot Toast** | Notification toast alerts on SSE push events | 2.x |
| **Recharts** | Dashboard analytics charts — line trends, pie breakdowns | 3.x |
| **react-icons** | Icon library | 4.x |
| **Vercel** | Static SPA hosting with SPA rewrite rules | — |

---

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx                       
│   ├── App.jsx                        
│   ├── index.css                      
│   │
│   ├── config/
│   │   └── index.js                   
│   │
│   ├── routes/
│   │   ├── routeConfig.js             
│   │   └── RequireValidRole.jsx       
│   │
│   ├── services/                      
│   │   ├── auth/
│   │   │   └── auth.service.js                
│   │   ├── shipper/
│   │   │   ├── shipments.service.js           
│   │   │   ├── dashboard.service.js           
│   │   │   └── profile.service.js             
│   │   ├── carrier/
│   │   │   ├── shipments.service.js           
│   │   │   ├── bids.service.js                
│   │   │   ├── vehicles.service.js            
│   │   │   ├── dashboard.service.js           
│   │   │   └── profile.service.js             
│   │   ├── notifications/
│   │   │   └── notification.service.js        
│   │   └── payments/
│   │       └── payment.service.js             
│   │
│   ├── hooks/                         
│   │   ├── index.js                   
│   │   ├── auth/                      
│   │   ├── shipper/
│   │   │   ├── dashboard/             
│   │   │   ├── shipments/             
│   │   │   └── profile/               
│   │   ├── carrier/
│   │   │   ├── dashboard/             
│   │   │   ├── shipments/             
│   │   │   ├── bids/                  
│   │   │   ├── vehicles/              
│   │   │   ├── profile/               
│   │   │   └── useAvailableVehiclesForBid.js
│   │   ├── notifications/
│   │   │   └── useNotifications.js    
│   │   └── payments/
│   │       └── useCreatePaymentOrder.js  
│   │
│   ├── components/
│   │   ├── ui/                        
│   │   │   ├── Badge.jsx              
│   │   │   ├── Button.jsx             
│   │   │   ├── Input.jsx              
│   │   │   ├── Tabs.jsx               
│   │   │   ├── TimePicker.jsx         
│   │   │   ├── PageHeader.jsx         
│   │   │   ├── PageLoader.jsx         
│   │   │   ├── EmptyState.jsx         
│   │   │   └── InfoRow.jsx            
│   │   │
│   │   ├── dashboard/                 
│   │   │   ├── DashboardLayout.jsx    
│   │   │   ├── Sidebar.jsx            
│   │   │   ├── Topbar.jsx             
│   │   │   ├── KPIs.jsx               
│   │   │   ├── EarningsTrendChart.jsx 
│   │   │   └── ShipmentStatusPieChart.jsx  
│   │   │
│   │   ├── cards/                     
│   │   │   ├── BaseCard.jsx           
│   │   │   ├── Card.jsx              
│   │   │   ├── KPICard.jsx            
│   │   │   └── partials/              
│   │   │
│   │   ├── details/                   
│   │   │   ├── DetailsPageLayout.jsx  
│   │   │   ├── BasicInfoSection.jsx   
│   │   │   ├── ShipmentDetails.jsx    
│   │   │   ├── CarrierDetails.jsx     
│   │   │   ├── ShipperDetails.jsx     
│   │   │   ├── VehicleDetails.jsx     
│   │   │   └── TimelineAndLocations.jsx  
│   │   │
│   │   ├── modals/                    
│   │   │   ├── Modal.jsx              
│   │   │   ├── ConfirmationModal.jsx  
│   │   │   ├── PlaceBidModal.jsx      
│   │   │   ├── AcceptBidModal.jsx     
│   │   │   ├── PaymentModal.jsx       
│   │   │   ├── RatingModal.jsx        
│   │   │   ├── ConfirmPickupDeliveryModal.jsx  
│   │   │   ├── NotInterestedModal.jsx 
│   │   │   ├── AddVehicleModal.jsx    
│   │   │   ├── LoginRoleSelectModal.jsx  
│   │   │   ├── LoginFormModal.jsx     
│   │   │   └── UpdateProfileModal.jsx 
│   │   │
│   │   ├── form/                      
│   │   │   ├── AddressFields.jsx      
│   │   │   └── VehicleTypeSelector.jsx  
│   │   │
│   │   └── site/                      
│   │       ├── Navbar.jsx             
│   │       ├── Hero.jsx               
│   │       ├── ForShippers.jsx        
│   │       ├── ForCarriers.jsx        
│   │       ├── PlatformFeatures.jsx   
│   │       └── Footer.jsx             
│   │
│   ├── pages/
│   │   ├── Landing.jsx                
│   │   ├── NotFound.jsx               
│   │   ├── auth/
│   │   │   ├── Login.jsx              
│   │   │   └── Register.jsx           
│   │   ├── shipper/                   
│   │   │   ├── dashboard/             
│   │   │   ├── create-shipment/       
│   │   │   ├── unassigned-shipments/  
│   │   │   ├── active-shipments/      
│   │   │   ├── pending-payments/      
│   │   │   ├── shipment-history/      
│   │   │   ├── cancelled-shipments/   
│   │   │   └── profile/               
│   │   └── carrier/                   
│   │       ├── dashboard/             
│   │       ├── find-shipments/        
│   │       ├── bids/                  
│   │       ├── active-shipments/      
│   │       ├── pending-payments/      
│   │       ├── shipment-history/      
│   │       ├── fleet/                 
│   │       └── profile/               
│   │
│   ├── utils/
│   │   ├── axios.js                   
│   │   ├── authUtils.js               
│   │   ├── formatters.js              
│   │   ├── dateTimeHelpers.js         
│   │   ├── shipmentCapacity.js        
│   │   ├── badges/                    
│   │   │   ├── statusBadge.js         
│   │   │   ├── activeShipment.js      
│   │   │   └── closingBadge.js        
│   │   └── validations/               
│   │       ├── validations.js         
│   │       ├── registerForm.js        
│   │       ├── loginForm.js           
│   │       ├── createShipmentForm.js  
│   │       ├── placeBidForm.js        
│   │       ├── addVehicleForm.js      
│   │       ├── profileUpdateForm.js   
│   │       ├── profileUpdateFormModal.js  
│   │       └── carrierProfileUpdateForm.js  
│   │
│   ├── lib/
│   │   └── queryClient.js             
│   │
│   └── assets/                        
│
├── index.html                         
├── package.json
├── vite.config.js                     
├── tailwind.config.js                 
├── postcss.config.js                  
├── vercel.json                        
├── eslint.config.js
├── .env.example
└── .gitignore
```

---

## Silent Token Refresh (Axios Interceptor)

The Axios interceptor handles JWT expiry transparently — no user-facing re-login until the refresh token itself expires.

```
User makes API call → backend returns 401 (access token expired)
                          ↓
Interceptor catches 401 (skips auth endpoints)
                          ↓
Is another refresh already in progress?
  ├─ YES → queue this request (Promise-based queue)
  └─ NO  → start refresh
                          ↓
POST /auth/refresh-token (HttpOnly cookie carries refresh token)
                          ↓
Success?
  ├─ YES → update localStorage expiry, process queued requests,
  │         reconnect SSE (window.__reconnectSSE), retry original request
  └─ NO  → clear all auth data, redirect to /login, alert "Session expired"
```

**Key implementation details:**

- **Request coalescing:** If 5 requests fail simultaneously with 401, only one refresh call fires. The other 4 wait in a Promise queue and replay after the refresh succeeds.
- **10-second debounce:** If a refresh happened in the last 10 seconds, the interceptor skips the refresh and retries the request immediately — prevents rapid-fire refresh loops.
- **SSE reconnection:** After a successful token refresh, the interceptor calls `window.__reconnectSSE()` (registered by the notification hook) to re-establish the SSE connection with the fresh token.
- **Auth endpoint exclusion:** Login, register, and refresh-token endpoints are never retried — prevents infinite loops.

---

## SSE Notification System (Client-Side)

The `useNotifications` hook manages the entire real-time notification lifecycle — SSE connection, toast alerts, unread count, panel state, and deep-link navigation.

### How It Works

```
User authenticates → useNotifications detects user._id
                          ↓
2-second delay (prevents race with token setup)
                          ↓
Opens EventSource → GET /notifications/stream (withCredentials: true)
                          ↓
Server sends { type: "CONNECTED" } → ignored by client
                          ↓
On incoming notification:
  1. Prepend to local notifications array
  2. Increment unread count
  3. Fire toast: "🔔 {message}" (4-second duration)
                          ↓
On SSE error → close connection → retry in 5 seconds
```

**Auto-reconnection:** On SSE error, the connection closes and reconnects after 5 seconds. The `connectSSE` function is also exposed via `window.__reconnectSSE` — the Axios interceptor calls this after a successful token refresh to re-establish SSE with fresh credentials.

### Notification Panel UX

| Action | Behavior |
|---|---|
| **Bell click (open)** | Fetches latest 15 notifications from DynamoDB |
| **Bell click (close)** | Marks all notifications as read via API, resets unread count |
| **"View All" click** | Fetches up to 500 notifications (30-day history) |
| **"Mark All as Read"** | Batch marks all as read, updates local state optimistically |
| **Notification click** | Closes panel, marks all read, navigates to relevant page |

### Deep-Link Navigation

Every notification type maps to a specific dashboard route:

| Type | Navigates To |
|---|---|
| `FIRST_BID` | `/shipper/dashboard/unassigned-shipments` |
| `BID_ACCEPTED` | `/carrier/dashboard/active-shipments` |
| `BID_REJECTED` | `/carrier/dashboard/bids?tab=rejected` |
| `DELIVERY_CONFIRMED` | `/shipper/dashboard/pending-payments` |
| `PAYMENT_RECEIVED` | `/carrier/dashboard/shipment-history/{shipmentId}` |
| `SHIPMENT_EXPIRED` | `/shipper/dashboard/unassigned-shipments?tab=expired` |
| *(+ 11 more types)* | *(see `getNotificationRoute` in useNotifications.js)* |

---

## Razorpay Checkout Integration

The `useCreatePaymentOrder` hook handles the entire client-side payment flow — from order creation to Razorpay modal launch.

```
Shipper clicks "Pay Now" on delivered shipment
              ↓
useMutation → POST /payments/create-order
              ↓
Backend returns { orderId, key, amount }
              ↓
Dynamically inject Razorpay checkout.js script
              ↓
Open Razorpay modal with:
  → key, orderId, amount (INR)
  → FleetHub branding (orange theme: #ea580c)
  → Prefill: name, email
              ↓
User completes payment on Razorpay UI
              ↓
handler() fires → onSuccess callback (UI update)
              ↓
Razorpay webhook handles actual verification on backend
```

**Why dynamic script loading?** The Razorpay SDK (`checkout.js`) is only loaded when a payment is actually initiated — not on every page load. This keeps the initial bundle clean and avoids loading third-party scripts unnecessarily.

**Webhook-first verification:** The frontend's `handler()` callback fires after the user completes payment on Razorpay's UI, but actual payment verification happens via the backend webhook (`HMAC-SHA256` signature check). The frontend only triggers a UI refresh — no client-side verification.

---

## Role-Based Routing

### Route Guard

All dashboard routes pass through `RequireValidRole` — a wrapper component that checks the user's role from localStorage:

```
Route accessed → RequireValidRole checks getStoredRole()
                          ↓
No role?     → Redirect to /login
Invalid role? → Redirect to /404
Wrong role?  → Redirect to /404  (e.g. carrier accessing /shipper/*)
Correct role? → Render page
```

### Route Architecture

| Scope | Routes | Example Path |
|---|---|---|
| **Public** | 4 | `/`, `/login`, `/register`, `/404` |
| **Shipper** | 15 | `/shipper/dashboard/*` |
| **Carrier** | 14 | `/carrier/dashboard/*` |
| **Total** | 33 | — |

All 29 authenticated routes are defined in `routeConfig.js` as a flat array with `{ path, element, role }` — the `App.jsx` maps over this array and wraps each route with `RequireValidRole`.

---

## React Query Architecture

### Configuration

```js
// lib/queryClient.js
{
  staleTime: 30 seconds,     // data considered fresh for 30s
  gcTime: 10 minutes,        // unused cache kept for 10min (formerly cacheTime)
  retry: 1,                  // one retry on failure
  refetchOnWindowFocus: false // no refetch when tab regains focus
}
```

### Hook Pattern

Every API operation has a dedicated hook. The pattern is consistent across all 65 hooks:

**Queries** (data fetching):
```js
// hooks/shipper/shipments/useUnassignedShipments.js
const { data, isLoading, error } = useQuery({
  queryKey: ["shipper", "unassigned-shipments", tab],
  queryFn: () => getUnassignedShipments(tab),
});
```

**Mutations** (data modification):
```js
// hooks/carrier/bids/usePlaceBid.js
const mutation = useMutation({
  mutationFn: placeBid,
  onSuccess: () => {
    queryClient.invalidateQueries(["carrier", "shipments"]);
    toast.success("Bid placed successfully");
  },
});
```

**Cache invalidation** is surgical — mutations only invalidate the query keys they affect. For example, accepting a bid invalidates `["shipper", "unassigned-shipments"]` and `["shipper", "active-shipments"]` but not `["shipper", "shipment-history"]`.

---

## Authentication Flow

### Login

```
User enters email/GST + password + role (SHIPPER/CARRIER)
                    ↓
POST /auth/login → backend validates, returns JWT tokens as HttpOnly cookies
                    ↓
On success:
  1. Store token expiry timestamps in localStorage
  2. Fetch full user profile via GET /auth/me
  3. Store user data in localStorage (role, companyName, email, etc.)
  4. Navigate to /{role}/dashboard
```

### Session Persistence

User data and token expiry are stored in localStorage under configurable keys:
- `fleetHub_user` — user profile object (role, _id, companyName, etc.)
- `fleetHub_tokenExpiry` — access/refresh token expiry timestamps

On page reload, the app reads from localStorage to restore the authenticated state. If tokens have expired, the Axios interceptor handles silent refresh.

### Logout

```
POST /auth/logout → server invalidates refresh token
                   ↓
Clear localStorage (user data + token expiry)
Clear HttpOnly cookies (access + refresh tokens)
Navigate to /login
```

---

## Component Architecture

### Design System (`components/ui/`)

9 primitive components that all pages build from:

| Component | Purpose |
|---|---|
| `Button` | Primary/secondary buttons with loading spinner state |
| `Input` | Text input with label, error message, and optional icon |
| `Badge` | Color-coded status labels |
| `Tabs` | Tab switcher for list pages (e.g., open/expired shipments) |
| `TimePicker` | Date/time picker for pickup/delivery confirmation |
| `PageHeader` | Page title with consistent styling |
| `PageLoader` | Full-page centered loading spinner |
| `EmptyState` | "No data" placeholder with icon and message |
| `InfoRow` | Key-value pair for detail pages |

### Dashboard Layout

Every dashboard page renders inside `DashboardLayout`:

```
┌────────────────────────────────────────────────────────┐
│ Topbar (notifications bell, user menu, hamburger)      │
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│ Sidebar  │  Page Content                               │
│ (nav     │  (rendered by child route)                  │
│  links)  │                                             │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

The sidebar is **role-aware** — shipper sees shipment management links, carrier sees bid/fleet management links. Both sidebars are collapsible on mobile.

### Modal System

12 purpose-built modals extending a base `Modal` component with backdrop overlay and slide-up CSS animation (`animate-modal-slide-up`). Key modals:

| Modal | Trigger |
|---|---|
| `PlaceBidModal` | Carrier placing a bid — vehicle selector, amount, transit hours |
| `AcceptBidModal` | Shipper confirming bid acceptance |
| `PaymentModal` | Shipper initiating Razorpay payment |
| `RatingModal` | Shipper rating carrier (1-5 stars) |
| `ConfirmPickupDeliveryModal` | Carrier confirming pickup/delivery with date/time picker |
| `AddVehicleModal` | Carrier adding vehicle to fleet |

### Analytics Charts (Recharts)

Two chart types available on both dashboards:

| Chart | Shipper View | Carrier View |
|---|---|---|
| **Line Chart** | Monthly shipping cost trend | Monthly earnings trend |
| **Pie Chart** | Shipment status breakdown | Shipment status breakdown |

---

## Client-Side Validation

9 validation schema files in `utils/validations/` provide field-level validation for all forms. Validation runs before API calls — errors display inline via the `Input` component's error prop.

| Schema | Validates |
|---|---|
| `registerForm.js` | Owner name, company, email, phone, GST, password, address |
| `loginForm.js` | Email/GST, password, role |
| `createShipmentForm.js` | Product, budget, vehicle types, dates, pickup/delivery locations |
| `placeBidForm.js` | Bid amount, transit hours, vehicle selection |
| `addVehicleForm.js` | Vehicle number, type, capacity, manufacturing year |
| `profileUpdateForm.js` | Name, phone, address fields |
| `validations.js` | Core validators — email regex, phone regex, GST format, password length |

---

## Styling

- **Tailwind CSS 4** via PostCSS integration (`@import "tailwindcss"` in `index.css`)
- **Dark theme** throughout — `bg-black/40`, `bg-white/5`, `text-white`, `border-white/10`
- **Orange accent color** — `#f97316` (orange-500) for primary actions, borders, focus states
- **Global utility classes** defined in `index.css`: `.label`, `.input`, `.card`, `.card-title`, `.error`
- **Modal animation**: Custom `@keyframes modal-slide-up` with opacity + translateY + scale

---

## Local Development

### Prerequisites
- Node.js 22
- Backend running at `http://localhost:8000` (see [backend/README.md](../backend/README.md))

### Setup

```bash
cd frontend
npm install
cp .env.example .env    # fill in your values
npm run dev             # starts Vite dev server on port 5173
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start Vite dev server with HMR |
| `build` | `npm run build` | Production build to `dist/` |
| `preview` | `npm run preview` | Preview production build locally |
| `lint` | `npm run lint` | ESLint check |

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_ACCESS_TOKEN_EXPIRY` | Access token lifetime in ms (for localStorage tracking) | `900000` (15 min) |
| `VITE_REFRESH_TOKEN_EXPIRY` | Refresh token lifetime in ms | `1296000000` (15 days) |
| `VITE_USER_STORAGE_KEY` | localStorage key for user data | `fleetHub_user` |
| `VITE_TOKEN_EXPIRY_KEY` | localStorage key for token expiry timestamps | `fleetHub_tokenExpiry` |

---

## Related

- Backend: [backend/README.md](../backend/README.md)
- Full architecture & deployment: [Root README](../README.md)
- Terraform infrastructure: [terraform/](../terraform/)
