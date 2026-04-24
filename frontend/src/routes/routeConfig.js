import Dashboard from "../pages/shipper/dashboard/Dashboard";
import CreateShipment from "../pages/shipper/create-shipment/CreateShipment";
import UnassignedShipments from "../pages/shipper/unassigned-shipments/UnassignedShipments";
import UnassignedShipmentDetails from "../pages/shipper/unassigned-shipments/UnassignedShipmentDetails";
import ShipmentBids from "../pages/shipper/unassigned-shipments/ShipmentBids";
import BidDetails from "../pages/shipper/unassigned-shipments/ShipmentBidDetails";
import ActiveShipments from "../pages/shipper/active-shipments/ActiveShipments";
import ActiveShipmentDetails from "../pages/shipper/active-shipments/ActiveShipmentDetails";
import PendingPayments from "../pages/shipper/pending-payments/PendingPayments";
import PendingPaymentDetails from "../pages/shipper/pending-payments/PendingPaymentDetails";
import ShipmentHistory from "../pages/shipper/shipment-history/ShipmentHistory";
import ShipmentHistoryDetails from "../pages/shipper/shipment-history/ShipmentHistoryDetails";
import Profile from "../pages/shipper/profile/Profile";
import CancelledShipments from "../pages/shipper/cancelled-shipments/CancelledShipments";
import CancelledShipmentDetails from "../pages/shipper/cancelled-shipments/CancelledShipmentDetails";

import CarrierDashboard from "../pages/carrier/dashboard/Dashboard";
import CarrierFindShipments from "../pages/carrier/find-shipments/FindShipments";
import CarrierFindShipmentsDetails from "../pages/carrier/find-shipments/FindShipmentsDetails";
import CarrierBids from "../pages/carrier/bids/Bids";
import CarrierBidDetails from "../pages/carrier/bids/BidDetails";
import CarrierActiveShipments from "../pages/carrier/active-shipments/ActiveShipments";
import CarrierActiveShipmentDetails from "../pages/carrier/active-shipments/ActiveShipmentDetails";
import CarrierPendingPayments from "../pages/carrier/pending-payments/PendingPayments";
import CarrierPendingPaymentDetails from "../pages/carrier/pending-payments/PendingPaymentDetails";
import CarrierShipmentHistory from "../pages/carrier/shipment-history/ShipmentHistory";
import CarrierShipmentHistoryDetails from "../pages/carrier/shipment-history/ShipmentHistoryDetails";
import CarrierFleet from "../pages/carrier/fleet/Fleet";
import CarrierVehicleDetails from "../pages/carrier/fleet/VehicleDetails";
import CarrierProfile from "../pages/carrier/profile/Profile";

export const appRoutes = [
  // Shipper routes
  {
    path: "/shipper/dashboard",
    element: Dashboard,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/create-shipment",
    element: CreateShipment,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/unassigned-shipments",
    element: UnassignedShipments,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/unassigned-shipments/:shipmentId",
    element: UnassignedShipmentDetails,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/shipment-bids/:shipmentId",
    element: ShipmentBids,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/shipment-bids/:shipmentId/bid/:bidId",
    element: BidDetails,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/active-shipments",
    element: ActiveShipments,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/active-shipments/:shipmentId",
    element: ActiveShipmentDetails,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/pending-payments",
    element: PendingPayments,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/pending-payments/:shipmentId",
    element: PendingPaymentDetails,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/shipment-history",
    element: ShipmentHistory,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/shipment-history/:shipmentId",
    element: ShipmentHistoryDetails,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/profile",
    element: Profile,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/cancelled-shipments",
    element: CancelledShipments,
    role: "shipper",
  },
  {
    path: "/shipper/dashboard/cancelled-shipments/:shipmentId",
    element: CancelledShipmentDetails,
    role: "shipper",
  },
  {
  },
  // Carrier routes
  {
    path: "/carrier/dashboard",
    element: CarrierDashboard,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/find-shipments",
    element: CarrierFindShipments,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/find-shipments/:shipmentId",
    element: CarrierFindShipmentsDetails,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/bids",
    element: CarrierBids,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/bids/:bidId",
    element: CarrierBidDetails,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/active-shipments",
    element: CarrierActiveShipments,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/active-shipments/:shipmentId",
    element: CarrierActiveShipmentDetails,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/pending-payments",
    element: CarrierPendingPayments,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/pending-payments/:shipmentId",
    element: CarrierPendingPaymentDetails,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/shipment-history",
    element: CarrierShipmentHistory,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/shipment-history/:shipmentId",
    element: CarrierShipmentHistoryDetails,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/fleet",
    element: CarrierFleet,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/fleet/:vehicleId",
    element: CarrierVehicleDetails,
    role: "carrier",
  },
  {
    path: "/carrier/dashboard/profile",
    element: CarrierProfile,
    role: "carrier",
  },
];
