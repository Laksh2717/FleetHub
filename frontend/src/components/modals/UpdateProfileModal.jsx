import { useState, useMemo, useEffect } from "react";
import Modal from "./Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { validateProfileUpdateForm } from "../../utils/validations/profileUpdateFormModal";

export default function UpdateProfileModal({
  profile = {},
  onUpdate,
  onClose,
  isLoading = false,
}) {
  const initialFormData = useMemo(
    () => ({
      companyName: profile.companyName || "",
      gstNumber: profile.gstNumber || "",
      ownerName: profile.ownerName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      street: profile.address?.street || "",
      city: profile.address?.city || "",
      state: profile.address?.state || "",
      pincode: profile.address?.pincode || "",
    }),
    [profile],
  );
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateProfileUpdateForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onUpdate(formData);
  };

  return (
    <Modal isOpen onClose={onClose} title="Update Profile">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-3">
          <Input
            label="Company Name"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={handleChange}
            error={errors.companyName}
            required
          />
          <Input
            label="Owner Name"
            name="ownerName"
            type="text"
            value={formData.ownerName}
            onChange={handleChange}
            error={errors.ownerName}
            required
          />
          <Input
            label="Email"
            name="email"
            type="text"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />
        </div>
        <div>
          <Input
            label="Street / Area"
            name="street"
            type="text"
            value={formData.street}
            onChange={handleChange}
            error={errors.street}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Input
              label="City"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
              required
            />
          </div>
          <div>
            <Input
              label="State"
              name="state"
              type="text"
              value={formData.state}
              onChange={handleChange}
              error={errors.state}
              required
            />
          </div>
          <div>
            <Input
              label="Pincode"
              name="pincode"
              type="text"
              value={formData.pincode}
              onChange={handleChange}
              error={errors.pincode}
              required
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
          <Button onClick={onClose} disabled={isLoading} variant="ghost">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
