export default function DetailsPageLayout({
  onBack,
  shipmentRef,
  backRowRight,
  refRowRight,
  children,
}) {
  return (
    <div className="space-y-4">
      {/* Top Row: Back Button and optional right content */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-white/20 text-white hover:border-orange-500/80 hover:text-orange-400 transition cursor-pointer"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        {backRowRight && <div>{backRowRight}</div>}
      </div>

      {/* Shipment Ref Row and optional right content */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm uppercase tracking-wide text-orange-400">Shipment Ref</span>
          <span className="text-orange-400">:</span>
          <span className="text-xl font-bold text-white">{shipmentRef}</span>
        </div>
        {refRowRight && <div>{refRowRight}</div>}
      </div>

      {/* Main details content */}
      {children}
    </div>
  );
}
