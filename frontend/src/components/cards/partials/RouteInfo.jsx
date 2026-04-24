import { MdLocationOn } from "react-icons/md";

export default function RouteInfo({ from, to, className = "" }) {
  if (!from && !to) return null;
  return (
    <div
      className={`flex items-center gap-2 mb-2 pb-2 border-b border-white/10 ${className}`}
    >
      <MdLocationOn className="text-orange-500 text-base shrink-0" />
      {from && <span className="text-white font-medium text-base">{from}</span>}
      <span className="text-orange-500 text-lg"> → </span>
      {to && <span className="text-white font-medium text-base">{to}</span>}
    </div>
  );
}
