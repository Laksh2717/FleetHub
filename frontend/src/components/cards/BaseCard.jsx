const BaseCard = ({
  shipmentRef,
  badge,
  children,
  className = "",
  ...rest
}) => {
  return (
    <div
      className={`bg-black/40 border border-white/10 rounded-lg p-4 hover:border-orange-500/50 transition cursor-pointer hover:shadow-lg hover:shadow-orange-500/20 ${className}`}
      {...rest}
    >
      {(shipmentRef || badge) && (
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/10">
          {shipmentRef && (
            <div className="text-orange-500 font-bold text-lg truncate">
              {shipmentRef}
            </div>
          )}
          {badge}
        </div>
      )}
      {children}
    </div>
  );
};

export default BaseCard;
