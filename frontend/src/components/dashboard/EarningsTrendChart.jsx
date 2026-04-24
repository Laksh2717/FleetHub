import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { MdTrendingUp } from "react-icons/md";
import { formatCurrency } from "../../utils/formatters";

export default function EarningsTrendChart({
  title = "Earnings Trend",
  icon = <MdTrendingUp className="text-orange-500 text-2xl" />,
  year,
  availableYears = [],
  onYearChange,
  total,
  loading,
  data = [],
}) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 flex-1 transition-colors duration-200 hover:border-orange-500">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {icon}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-md text-gray-400">Year</label>
            <select
              className="bg-black/40 border border-white/10 text-white text-md rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
              value={year}
              onChange={onYearChange}
              disabled={loading}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-md text-gray-400">Total:</span>
            <span className="text-lg font-bold text-orange-400">
              {formatCurrency ? formatCurrency(total) : total}
            </span>
            {loading && <span className="text-xs text-gray-400">Updating...</span>}
          </div>
        </div>
      </div>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ left: 12, right: 12, bottom: 8 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} padding={{ left: 20, right: 20 }} />
            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px" }}
              formatter={(value) => (formatCurrency ? formatCurrency(value) : value)}
              labelStyle={{ color: "white" }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#ea580c"
              strokeWidth={3}
              dot={{ fill: "#ea580c", r: 4 }}
              activeDot={{ r: 6 }}
              fillOpacity={1}
              fill="url(#colorAmount)"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400">No data yet</p>
        </div>
      )}
    </div>
  );
}
