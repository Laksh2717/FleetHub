import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierFindShipments } from "../../../hooks/carrier/shipments";
import Card from "../../../components/cards/Card";
import PageHeader from "../../../components/ui/PageHeader";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import { getDeadlineBadge } from "../../../utils/badges/closingBadge";
import { shipmentCapacity } from "../../../utils/shipmentCapacity";
import { formatVehicleType } from "../../../utils/formatters";

const VEHICLE_TYPES = [
  "TRAILER_FLATBED",
  "OPEN_BODY",
  "CLOSED_CONTAINER",
  "TANKER",
  "REFRIGERATED",
  "LCV",
];

const DEBOUNCE_DELAY = 500; // 500ms delay

export default function CarrierFindShipments() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Input states (for UI)
  const [pickupSearchInput, setPickupSearchInput] = useState("");
  const [deliverySearchInput, setDeliverySearchInput] = useState("");
  
  // Debounced filter states (for API calls)
  const [pickupSearch, setPickupSearch] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");
  
  const [vehicleType, setVehicleType] = useState("");
  const [sortOption, setSortOption] = useState("latest_asc");
  
  const pickupSearchTimeout = useRef(null);
  const deliverySearchTimeout = useRef(null);
  
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  // Debounce pickup search
  useEffect(() => {
    if (pickupSearchTimeout.current) {
      clearTimeout(pickupSearchTimeout.current);
    }

    pickupSearchTimeout.current = setTimeout(() => {
      setPickupSearch(pickupSearchInput);
      setCurrentPage(1);
    }, DEBOUNCE_DELAY);

    return () => {
      if (pickupSearchTimeout.current) {
        clearTimeout(pickupSearchTimeout.current);
      }
    };
  }, [pickupSearchInput]);

  // Debounce delivery search
  useEffect(() => {
    if (deliverySearchTimeout.current) {
      clearTimeout(deliverySearchTimeout.current);
    }

    deliverySearchTimeout.current = setTimeout(() => {
      setDeliverySearch(deliverySearchInput);
      setCurrentPage(1);
    }, DEBOUNCE_DELAY);

    return () => {
      if (deliverySearchTimeout.current) {
        clearTimeout(deliverySearchTimeout.current);
      }
    };
  }, [deliverySearchInput]);

  const [sortBy, sortOrder] = sortOption.split("_");

  const filters = {
    ...(pickupSearch && { pickupSearch }),
    ...(deliverySearch && { deliverySearch }),
    ...(vehicleType && { vehicleType }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
  };

  const { shipments, page, total, totalPages, hasNextPage, hasPrevPage, isLoading: loading } = useCarrierFindShipments(currentPage, ITEMS_PER_PAGE, filters);

  const getBadge = (shipment) => {
    const closingBadge = getDeadlineBadge({ date: shipment.biddingDeadline, type: "closing" });
    if (closingBadge.text) {
      return <Badge text={closingBadge.text} variant={closingBadge.variant} size="sm" />;
    }
    return null;
  };

  const handlePreviousPage = () => {
    if (hasPrevPage && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const SORT_OPTIONS = [
    { value: "latest_asc", label: "Latest ▲" },
    { value: "latest_desc", label: "Latest ▼" },
    { value: "price_asc", label: "Price Low → High" },
    { value: "price_desc", label: "Price High → Low" },
    { value: "deadline_asc", label: "Deadline Earliest → Latest" },
    { value: "deadline_desc", label: "Deadline Latest → Earliest" },
  ];

  return (
    <DashboardLayout role={user.role?.toLowerCase()} companyName={user.companyName}>
      <div className="flex flex-col h-full gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0 max-w-full lg:max-w-2xl">
            <PageHeader
              title="Find Shipments"
              subtitle="Browse and bid on available shipments"
              subtitleClassName="lg:whitespace-nowrap"
            />
          </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:ml-8">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-300">Pickup Location</label>
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  value={pickupSearchInput}
                  onChange={(e) => setPickupSearchInput(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                {pickupSearchInput && pickupSearchInput !== pickupSearch && (
                  <span className="text-xs text-orange-300">Searching...</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-300">Delivery Location</label>
                <input
                  type="text"
                  placeholder="Enter delivery location"
                  value={deliverySearchInput}
                  onChange={(e) => setDeliverySearchInput(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                {deliverySearchInput && deliverySearchInput !== deliverySearch && (
                  <span className="text-xs text-orange-300">Searching...</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-300">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="">All Types</option>
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-zinc-950 text-white">
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-300">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-zinc-950 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
        </div>

        {/* Shipments Grid */}
        <div className="flex-1 overflow-y-auto pr-4 pb-4">
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-xl font-bold text-white">Available Shipments</h3>
              <span className="text-sm text-gray-400">
                {total ? `${total.toLocaleString()} shipments found` : "Use the filters to find shipments"}
              </span>
            </div>
          </div>

          {loading && <PageLoader text="Loading shipments..." />}

          {!loading && shipments.length === 0 && <EmptyState title="No Shipments Found" description="Try adjusting your search or filters." />}

          {!loading && shipments.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shipments.map((s) => {
                  return (
                    <Card
                      key={s._id}
                      shipmentRef={s.shipmentRef}
                      badge={getBadge(s)}
                      partyInfo={{
                        shipper: s.shipperCompanyName,
                        receiver: s.receiverCompanyName,
                      }}
                      routeInfo={{
                        from: s.pickupCity,
                        to: s.deliveryCity,
                      }}
                      infoRows={{
                        requiredVehicles: formatVehicleType(s.requiredVehicleTypes),
                        shipment: shipmentCapacity(s.totalWeightTons, s.totalVolumeLitres),
                        product: s.product,
                      }}
                      twoColumnInfo={{
                        budgetPrice: s.budgetPrice,
                        biddingDeadline: s.biddingDeadline,
                      }}
                      timelineInfo={{
                        pickupDate: s.pickupDate,
                        estimatedDeliveryDate: s.estimatedDeliveryDate,
                      }}
                      onClick={() => navigate(`/carrier/dashboard/find-shipments/${s._id}`)}
                    />
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                  <span className="font-semibold">{Math.min(page * ITEMS_PER_PAGE, total)}</span> of{" "}
                  <span className="font-semibold">{total}</span> shipments
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={!hasPrevPage}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      hasPrevPage
                        ? "border-blue-500 text-blue-500 hover:bg-blue-50"
                        : "border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          pageNum === page
                            ? "bg-blue-500 text-white border-blue-500"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      hasNextPage
                        ? "border-blue-500 text-blue-500 hover:bg-blue-50"
                        : "border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

