import Input from "../ui/Input";

export default function VehicleTypeSelector({
  vehicleTypes = [],
  selectedTypes = [],
  onChange,
  error = "",
  disabled = false,
}) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Required Vehicle Types <span className="text-red-500">*</span>
        <span className="text-xs text-gray-400 ml-2">
          (Select at least one)
        </span>
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {vehicleTypes.map((type) => {
          const isTanker = type === "Tanker";
          const hasTankerSelected = selectedTypes.includes("Tanker");
          const hasOtherSelected = selectedTypes.some((t) => t !== "Tanker");
          const isDisabled =
            disabled ||
            (isTanker && hasOtherSelected) ||
            (!isTanker && hasTankerSelected);
            
          return (
            <div
              key={type}
              className={`px-4 py-2 bg-black/30 border border-white/20 rounded-md transition flex items-center gap-2 ${
                isDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-orange-500 cursor-pointer"
              } ${selectedTypes.includes(type) ? "border-orange-500 bg-orange-500/20" : ""}`}
              onClick={
                isDisabled
                  ? undefined
                  : (e) => {
                      // Prevent double toggle if checkbox itself is clicked
                      if (e.target.type !== "checkbox") {
                        onChange(type);
                      }
                    }
              }
              tabIndex={isDisabled ? -1 : 0}
              role="checkbox"
              aria-checked={selectedTypes.includes(type)}
            >
              <Input
                type="checkbox"
                name={`vehicleType_${type}`}
                value={selectedTypes.includes(type)}
                onChange={() => onChange(type)}
                disabled={isDisabled}
                label={<span className="text-white text-sm">{type}</span>}
                className="!mb-0"
              />
            </div>
          );
        })}
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
