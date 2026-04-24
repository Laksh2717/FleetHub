import Button from "../ui/Button";
import Input from "../ui/Input";

export default function AddressFields({
  prefix = "",
  formData = {},
  errors = {},
  onChange,
  disabled = false,
  onUseCompanyAddress,
  showUseCompanyAddress = false,
  loadingAddress = false,
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-white">
          {prefix === "pickup" ? "Pickup Location" : "Delivery Location"}
        </h2>
        {showUseCompanyAddress && (
          <Button onClick={onUseCompanyAddress} disabled={loadingAddress || disabled} size="md">
            Use Company Address
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Street"
          name={`${prefix}Street`}
          value={formData[`${prefix}Street`]}
          onChange={onChange}
          disabled={disabled}
          placeholder={`Enter ${prefix} street address`}
          error={errors[`${prefix}Street`]}
          required
          className="md:col-span-3"
        />
        <Input
          label="City"
          name={`${prefix}City`}
          value={formData[`${prefix}City`]}
          onChange={onChange}
          disabled={disabled}
          placeholder={`Enter ${prefix} city`}
          error={errors[`${prefix}City`]}
          required
        />
        <Input
          label="State"
          name={`${prefix}State`}
          value={formData[`${prefix}State`]}
          onChange={onChange}
          disabled={disabled}
          placeholder={`Enter ${prefix} state`}
          error={errors[`${prefix}State`]}
          required
        />
        <Input
          label="Pincode"
          name={`${prefix}Pincode`}
          value={formData[`${prefix}Pincode`]}
          onChange={onChange}
          disabled={disabled}
          placeholder="Enter 6-digit pincode"
          error={errors[`${prefix}Pincode`]}
          required
        />
      </div>
    </div>
  );
}
