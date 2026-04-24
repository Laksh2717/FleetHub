export default function PageHeader({ title, subtitle, subtitleClassName = "" }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {subtitle && (
        <p className={`text-gray-400 text-sm mt-1 ${subtitleClassName}`}>{subtitle}</p>
      )}
    </div>
  );
}
