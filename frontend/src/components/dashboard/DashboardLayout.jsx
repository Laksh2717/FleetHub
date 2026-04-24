import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import bgImage from "../../assets/hero-bg.png";

// Helper function to get active item from path
const getActiveItemFromPath = (pathname) => {
  // Dashboards
  if (pathname === "/shipper/dashboard" || pathname === "/carrier/dashboard")
    return "Dashboard";

  // Shipper: Create
  if (pathname === "/shipper/dashboard/create-shipment")
    return "Create Shipment";

  // Shipper: Unassigned (list, details, bids flows)
  if (pathname.startsWith("/shipper/dashboard/unassigned-shipments"))
    return "Unassigned Shipments";
  if (pathname.startsWith("/shipper/dashboard/shipment-bids"))
    return "Unassigned Shipments";

  // Active Shipments (list and details) for both roles
  if (
    pathname.startsWith("/shipper/dashboard/active-shipments") ||
    pathname.startsWith("/carrier/dashboard/active-shipments")
  )
    return "Active Shipments";

  // Pending Payments (list and details) for both roles
  if (
    pathname.startsWith("/shipper/dashboard/pending-payments") ||
    pathname.startsWith("/carrier/dashboard/pending-payments")
  )
    return "Pending Payments";

  // History (list and details) for both roles
  if (
    pathname.startsWith("/shipper/dashboard/shipment-history") ||
    pathname.startsWith("/carrier/dashboard/shipment-history")
  )
    return "Shipment History";

  // Profile
  if (
    pathname === "/shipper/dashboard/profile" ||
    pathname === "/carrier/dashboard/profile"
  )
    return "Profile";

  // Carrier specific
  if (pathname.startsWith("/carrier/dashboard/find-shipments"))
    return "Find Shipments";
  if (pathname.startsWith("/carrier/dashboard/bids")) return "Bids";
  if (pathname.startsWith("/carrier/dashboard/fleet")) return "Fleet";

  // Shipper specific
  if (pathname.startsWith("/shipper/dashboard/cancelled-shipments"))
    return "Cancelled Shipments";

  return "Dashboard";
};

export default function DashboardLayout({ role, companyName, children }) {
  const location = useLocation();

  // Derive activeItem from pathname without state
  const activeItem = useMemo(
    () => getActiveItemFromPath(location.pathname),
    [location.pathname],
  );

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background - Fixed */}
      <img
        src={bgImage}
        alt=""
        className="fixed inset-0 h-full w-full object-cover"
      />
      <div className="fixed inset-0 bg-black/40" />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <Sidebar role={role} activeItem={activeItem} />

        {/* Main Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Topbar companyName={companyName} />

          {/* Main Content - Scrollable */}
          <div className="flex-1 px-8 pt-4 pb-8 overflow-y-auto">
            {children ? (
              children
            ) : (
              <div className="bg-black/40 p-6">
                <h2 className="text-xl font-semibold mb-2">{activeItem}</h2>
                <p className="text-gray-300">
                  Content for <span className="text-white">{activeItem}</span>{" "}
                  will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
