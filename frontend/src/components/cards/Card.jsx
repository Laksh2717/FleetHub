import BaseCard from "./BaseCard";
import PartyInfo from "./partials/PartyInfo";
import RouteInfo from "./partials/RouteInfo";
import InfoRows from "./partials/InfoRows";
import TwoColumnInfo from "./partials/TwoColumnInfo";
import TimelineInfo from "./partials/TimelineInfo";

export default function Card({
  partyInfo = {},
  routeInfo = {},
  infoRows = {},
  twoColumnInfo = {},
  timelineInfo = {},
  shipmentRef,
  badge,
  className = "",
  hideTwoColumnInfo = false,
  children,
  ...rest
}) {
  const hasTwoColumnInfo = twoColumnInfo && Object.values(twoColumnInfo).some(Boolean);
  return (
    <BaseCard shipmentRef={shipmentRef} badge={badge} className={className} {...rest}>
      {partyInfo && <PartyInfo {...partyInfo} />}
      {routeInfo && <RouteInfo {...routeInfo} />}
      {infoRows && <InfoRows {...infoRows} />}
      {!hideTwoColumnInfo && hasTwoColumnInfo && <TwoColumnInfo {...twoColumnInfo} />}
      {timelineInfo && <TimelineInfo {...timelineInfo} />}
      {children}
    </BaseCard>
  );
}
