export default function InfoRow({ label, value, className = "", textSize = "text-base" }) {
  return (
    <div
      className={`grid grid-cols-[190px_20px_1fr] gap-x-2 items-baseline py-1 ${textSize} ${className}`}
    >
      <span className="text-orange-400 font-semibold text-left pr-2">{label}</span>
      <span className="text-gray-400 text-center">:</span>
      <span className="text-white font-semibold break-words">{value}</span>
    </div>
  );
}
