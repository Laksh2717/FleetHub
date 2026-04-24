import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getStoredUser } from "../../../utils/authUtils";
import { useShipperActiveShipmentDetails } from "../../../hooks/shipper/shipments";
import VehicleDetails from "../../../components/details/VehicleDetails";
import CarrierDetails from "../../../components/details/CarrierDetails";
import ShipmentDetails from "../../../components/details/ShipmentDetails";
import TimelineAndLocations from "../../../components/details/TimelineAndLocations";
import DetailsPageLayout from "../../../components/details/DetailsPageLayout";
import BasicInfoSection from "../../../components/details/BasicInfoSection";
import Badge from "../../../components/ui/Badge";
import {
  getShipmentBadge,
  getEstimatedDeliveryDate,
} from "../../../utils/badges/activeShipment";
import EmptyState from "../../../components/ui/EmptyState";
import PageLoader from "../../../components/ui/PageLoader";
import Tabs from "../../../components/ui/Tabs";

export default function ActiveShipmentDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();
  const [searchParams] = useSearchParams();
  const tabParam =
    searchParams.get("tab") === "in-transit" ? "in-transit" : "assigned";
  const [currentTime] = useState(() => Date.now());

  const user = getStoredUser();

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "shipper") {
      navigate("/404");
    }
  }, [user, navigate]);

  const derivedTab = useMemo(() => {
    if (tabParam) return tabParam;
    return "assigned";
  }, [tabParam]);

  const { shipment, isLoading: loading } = useShipperActiveShipmentDetails(
    shipmentId,
    derivedTab,
  );

  const handleBack = () => {
    navigate(`/shipper/dashboard/active-shipments?tab=${derivedTab}`);
  };

  const handleTabClick = (tab) => {
    navigate(`/shipper/dashboard/active-shipments?tab=${tab}`);
  };

  const refRowRight = () => {
    const { text, variant } = getShipmentBadge(
      shipment,
      derivedTab,
      currentTime,
    );
    return <Badge size="lg" text={text} variant={variant} />;
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
                  carrierCompanyName: shipment.carrierCompanyName,
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

              {/* Carrier Details Section */}
              <CarrierDetails
                carrier={{
                  companyName: shipment.carrierCompanyName,
                  ownerName: shipment.carrierOwnerName,
                  email: shipment.carrierEmail,
                  phone: shipment.carrierPhone,
                  gstNumber: shipment.carrierGstNumber,
                  address: shipment.carrierAddress,
                  averageRating: shipment.carrierAverageRating,
                  ratingCount: shipment.carrierRatingCount,
                  fleetSize: shipment.carrierFleetSize,
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
      </div>
    </DashboardLayout>
  );
}
