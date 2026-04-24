export default function TimePicker({
  label,
  dateValue,
  hourValue,
  minuteValue,
  amPmValue,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onAmPmChange,
  disabled = false,
  error,
  required = false,
  namePrefix = "",
  size = "lg", // 'lg' (default) or 'md'
}) {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2 items-end">
        <div className={size === "md" ? "flex-shrink-0 w-38" : "flex-shrink-0 w-48"}>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            name={`${namePrefix}Date`}
            value={dateValue}
            onChange={onDateChange}
            disabled={disabled}
            className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
        </div>
        <div className="flex gap-2 flex-1">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hour</label>
            <select
              name={`${namePrefix}Hour`}
              value={hourValue}
              onChange={onHourChange}
              disabled={disabled}
              className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min</label>
            <select
              name={`${namePrefix}Minute`}
              value={minuteValue}
              onChange={onMinuteChange}
              disabled={disabled}
              className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
            >
              {minutes.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">AM/PM</label>
            <select
              name={`${namePrefix}AmPm`}
              value={amPmValue}
              onChange={onAmPmChange}
              disabled={disabled}
              className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
