export default function KPICard({
  label,
  value,
  icon: Icon,
  color,
  hoverColor = "",
  valueClass = "",
  subValue = null,
}) {
  return (
    <div
      className={`bg-black/40 border border-white/10 rounded-lg p-3 flex flex-col justify-center transition-colors duration-200 ${hoverColor} flex-grow`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-400 uppercase tracking-wide font-medium">{label}</span>
        {Icon && <Icon className={color + " text-2xl"} />}
      </div>
      <div className={`text-2xl font-bold mt-2 ${valueClass}`}>{value} {subValue}</div>
    </div>
  );
}
