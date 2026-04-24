export default function EmptyState({ title, description }) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-12 text-center">
      {title && <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>}
      {description && (
        <p className="text-gray-400 text-sm">
          {description}
        </p>
      )}
    </div>
  );
}
