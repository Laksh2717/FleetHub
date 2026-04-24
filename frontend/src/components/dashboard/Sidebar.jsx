import {
  MdDashboard,
  MdLocalShipping,
  MdHistory,
  MdPayments,
  MdPerson,
  MdLogout,
  MdAssignmentLate,
  MdDirectionsCar,
  MdCancel,
} from "react-icons/md";
import { FaBox, FaSearch } from "react-icons/fa";
import { TbHammer } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import useLogout from "../../hooks/auth/useLogout";
import ConfirmationModal from "../modals/ConfirmationModal";

const shipperMenu = [
  { label: "Dashboard", icon: MdDashboard, path: "/shipper/dashboard" },
  { label: "Create Shipment", icon: FaBox, path: "/shipper/dashboard/create-shipment" },
  { label: "Unassigned Shipments", icon: MdAssignmentLate, path: "/shipper/dashboard/unassigned-shipments" },
  { label: "Active Shipments", icon: MdLocalShipping, path: "/shipper/dashboard/active-shipments" },
  { label: "Pending Payments", icon: MdPayments, path: "/shipper/dashboard/pending-payments" },
  { label: "Shipment History", icon: MdHistory, path: "/shipper/dashboard/shipment-history" },
  { label: "Cancelled Shipments", icon: MdCancel, path: "/shipper/dashboard/cancelled-shipments" },
  { label: "Profile", icon: MdPerson, path: "/shipper/dashboard/profile" },
];

const carrierMenu = [
  { label: "Dashboard", icon: MdDashboard, path: "/carrier/dashboard" },
  { label: "Find Shipments", icon: FaSearch, path: "/carrier/dashboard/find-shipments" },
  { label: "Bids", icon: TbHammer, path: "/carrier/dashboard/bids" },
  { label: "Active Shipments", icon: FaBox, path: "/carrier/dashboard/active-shipments" },
  { label: "Pending Payments", icon: MdPayments, path: "/carrier/dashboard/pending-payments" },
  { label: "Shipment History", icon: MdHistory, path: "/carrier/dashboard/shipment-history" },
  { label: "Fleet", icon: MdDirectionsCar, path: "/carrier/dashboard/fleet" },
  { label: "Profile", icon: MdPerson, path: "/carrier/dashboard/profile" },
];

export default function Sidebar({ role, activeItem }) {
  const navigate = useNavigate();
  const menu = role?.toLowerCase() === "carrier" ? carrierMenu : shipperMenu;
  const {
    showLogoutModal,
    openLogoutModal,
    cancelLogout,
    confirmLogout,
    isLoggingOut,
  } = useLogout();

  const handleMenuClick = (item) => {
    // Only navigate if the item has a path defined
    // The active state will be automatically updated by DashboardLayout based on the route
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      <aside className="w-64 flex flex-col bg-black/40 border-r border-white/10">
        {/* Logo */}
        <div className="py-6 text-center text-3xl font-extrabold cursor-pointer" onClick={() => navigate("/")}>
          <span className="text-white">Fleet</span>
          <span className="text-orange-500">Hub</span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-2 space-y-2">
          {menu.map((item) => {
            const isActive = activeItem === item.label;
            const IconComponent = item.icon;

            return (
              <div
                key={item.label}
                onClick={() => handleMenuClick(item)}
                className={`cursor-pointer rounded-md px-3 py-2 transition flex items-center gap-3
                  ${
                    isActive
                      ? "bg-orange-500 text-black font-semibold"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <IconComponent size={20} />
                {item.label}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-6">
          <div
            onClick={openLogoutModal}
            className="cursor-pointer rounded-md px-3 py-2 text-red-400 hover:bg-red-500 hover:text-white transition flex items-center gap-3"
          >
            <MdLogout size={20} />
            Logout
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <ConfirmationModal
          isOpen={showLogoutModal}
          onClose={cancelLogout}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          confirmText={isLoggingOut ? "Logging out..." : "Yes, Logout"}
          cancelText="No"
          onConfirm={confirmLogout}
          loading={isLoggingOut}
        />
      )}
    </>
  );
}
