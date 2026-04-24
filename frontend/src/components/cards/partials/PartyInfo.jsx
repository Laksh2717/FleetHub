export default function PartyInfo({
  shipper,
  receiver,
  carrier,
  isShipper = false,
  className = "",
}) {
  const info = [];
  if (shipper) info.push({ label: "Shipper", value: shipper });
  if (receiver) info.push({ label: "Receiver", value: receiver });
  if (carrier) info.push({ label: "Carrier", value: carrier });
  if (!carrier && isShipper) info.push({ label: "Carrier", value: "Not Assigned" });

  return (
    <div className={`space-y-1 mb-2 pb-2 border-b border-white/10 ${className}`}>
      {info.map((item, idx) => (
        <div className="flex items-center gap-2" key={idx}>
          <span className="text-sm text-gray-400 shrink-0">{item.label}:</span>
          <span className="text-white font-semibold text-base capitalize truncate">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
