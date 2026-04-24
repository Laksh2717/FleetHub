import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { MdLocalShipping } from "react-icons/md";

export default function ShipmentStatusPieChart({
  title = "Shipment Status",
  icon = <MdLocalShipping className="text-orange-500 text-2xl" />,
  range,
  onRangeChange,
  loading,
  data = [],
}) {
  // Color and label maps defined internally
  const colorMap = {
    ASSIGNED: "#3b82f6",
    IN_TRANSIT: "#a855f7",
    PENDING_PAYMENT: "#ef4444",
    COMPLETED: "#10b981",
    CREATED: "#f59e0b",
    DELIVERED: "#10b981",
  };
  const labelMap = {
    ASSIGNED: "Assigned",
    IN_TRANSIT: "In Transit",
    PENDING_PAYMENT: "Pending Payment",
    COMPLETED: "Completed",
    CREATED: "Created",
    DELIVERED: "Delivered",
  };
  const availableRanges = [7, 14, 30];
  const chartData = data.map((item) => ({
    name: item.status,
    value: item.count,
    displayName: labelMap[item.status] || item.status,
  }));
  const total = data.reduce((sum, d) => sum + (d.count || 0), 0);
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 flex-1 transition-colors duration-200 hover:border-orange-500">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-md text-gray-400">Range</label>
          <select
            className="bg-black/40 border border-white/10 text-white text-md rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={range}
            onChange={onRangeChange}
            disabled={loading}
          >
            {availableRanges.map((r) => (
              <option key={r} value={r}>Last {r} days</option>
            ))}
          </select>
          {loading && <span className="text-xs text-gray-400">Updating...</span>}
        </div>
      </div>
      {data && data.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="md:w-1/2 w-full">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  startAngle={90}
                  endAngle={450}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={Object.values(colorMap)[idx % Object.values(colorMap).length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px" }}
                  labelStyle={{ color: "white" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                <span>Status</span>
                <span>Shipments</span>
              </div>
              {data.map((item, idx) => {
                const pct = total > 0 ? (((item.count || 0) / total) * 100).toFixed(1) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colorMap[item.status] }} />
                      <span className="text-md text-gray-300">
                        {labelMap[item.status]} ({pct}%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-md text-white font-semibold">{item.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400">No shipment data yet</p>
        </div>
      )}
    </div>
  );
}
