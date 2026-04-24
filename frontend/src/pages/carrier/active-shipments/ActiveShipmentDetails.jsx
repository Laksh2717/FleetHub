import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import ConfirmPickupDeliveryModal from "../../../components/modals/ConfirmPickupDeliveryModal";
import {
  confirmPickup,
  confirmDelivery,
} from "../../../services/carrier/shipments.service";
import { getStoredUser } from "../../../utils/authUtils";
import { useCarrierActiveShipmentDetails } from "../../../hooks/carrier/shipments";
import VehicleDetails from "../../../components/details/VehicleDetails";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import {
  getShipmentBadge,
  getEstimatedDeliveryDate,
} from "../../../utils/badges/activeShipment";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Tabs from "../../../components/ui/Tabs";
import ShipperDetails from "../../../components/details/ShipperDetails";

export default function CarrierActiveShipmentDetails() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'pickup' or 'delivery'
  const navigate = useNavigate();
  const { shipmentId } = useParams();
  const [searchParams] = useSearchParams();
  const tabParam =
    searchParams.get("tab") === "in-transit" ? "in-transit" : "assigned";
  const [currentTime] = useState(() => Date.now());
  const user = getStoredUser();

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "carrier") {
      navigate("/404");
    }
  }, [user, navigate]);

  const derivedTab = useMemo(() => {
    if (tabParam) return tabParam;
    return "assigned";
  }, [tabParam]);

  const { shipment, isLoading: loading } = useCarrierActiveShipmentDetails(
    shipmentId,
    derivedTab,
  );

  const handleBack = () => {
    navigate(`/carrier/dashboard/active-shipments?tab=${derivedTab}`);
  };

  const handleTabClick = (tab) => {
    navigate(`/carrier/dashboard/active-shipments?tab=${tab}`);
  };

  const refRowRight = () => {
    if (!shipment) return null;
    const { text, variant } = getShipmentBadge(
      shipment,
      derivedTab,
      currentTime,
    );
    const handleOpenModal = (type) => {
      setModalType(type);
      setModalOpen(true);
    };
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={() =>
            handleOpenModal(derivedTab === "assigned" ? "pickup" : "delivery")
          }
        >
          {derivedTab === "assigned" ? "Confirm Pickup" : "Confirm Delivery"}
        </Button>
        <Badge size="lg" text={text} variant={variant} />
      </div>
    );
  };

  return (
    <DashboardLayout
      role={user.role?.toLowerCase()}
      companyName={user.companyName}
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <Tabs
          tabs={[
            { label: "Assigned", value: "assigned" },
            { label: "In Transit", value: "in-transit" },
          ]}
          activeTab={derivedTab}
          onChange={handleTabClick}
        />

        <div className="flex-1 overflow-y-auto pr-4">
          {loading && <PageLoader text="Loading shipment details..." />}
          {!loading && !shipment && (
            <EmptyState
              title="Shipment Not Found"
              description="The requested shipment could not be found."
            />
          )}
          {!loading && shipment && (
            <DetailsPageLayout
              onBack={handleBack}
              shipmentRef={shipment.shipmentRef}
              refRowRight={refRowRight()}
            >
              <BasicInfoSection
                info={{
                  shipperCompanyName: shipment.shipperCompanyName,
                  receiverCompanyName: shipment.receiverCompanyName,
                }}
              />

              {/* Shipment Details Section */}
              <ShipmentDetails
                shipment={{
                  product: shipment.product,
                  budgetPrice: shipment.budgetPrice,
                  bidAmount: shipment.bidAmount,
                  totalWeightTons: shipment.totalWeightTons,
                  totalVolumeLitres: shipment.totalVolumeLitres,
                  estimatedTransitHours: shipment.estimatedTransitHours,
                  description: shipment.description,
                }}
              />

              {/* Shipper Details Section */}
              <ShipperDetails
                shipper={{
                  companyName: shipment.shipperCompanyName,
                  ownerName: shipment.shipperOwnerName,
                  email: shipment.shipperEmail,
                  address: shipment.shipperAddress,
                  gstNumber: shipment.shipperGstNumber,
                  phone: shipment.shipperPhone,
                }}
              />

              {/* Vehicle Details Section */}
              <VehicleDetails
                vehicle={{
                  vehicleNumber: shipment.vehicleNumber,
                  vehicleType: shipment.vehicleType,
                  capacityTons: shipment.capacityTons,
                  capacityLitres: shipment.capacityLitres,
                  manufacturingYear: shipment.manufacturingYear,
                }}
              />

              {/* Locations & Timeline Section */}
              <TimelineAndLocations
                details={{
                  pickupLocation: shipment.pickupLocation,
                  deliveryLocation: shipment.deliveryLocation,
                  pickupDate: shipment.pickupDate,
                  estimatedDeliveryDate:
                    derivedTab === "assigned"
                      ? shipment.estimatedDeliveryDate
                      : getEstimatedDeliveryDate(shipment),
                  pickupConfirmedAt: shipment.pickupConfirmedAt,
                  estimatedTransitHours: shipment.estimatedTransitHours,
                }}
              />
            </DetailsPageLayout>
          )}
        </div>
        {/* Confirm Pickup/Delivery Modal */}
        <ConfirmPickupDeliveryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          type={modalType}
          confirmFn={modalType === "pickup" ? confirmPickup : confirmDelivery}
          shipmentId={shipmentId}
        />
      </div>
    </DashboardLayout>
  );
}
