import Modal from "./Modal";
import TimePicker from "../ui/TimePicker";
import Button from "../ui/Button";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ConfirmPickupDeliveryModal({
  isOpen,
  onClose,
  type, // 'pickup' or 'delivery'
  confirmFn, // async function to call (confirmPickup or confirmDelivery)
  shipmentId,
}) {
  const navigate = useNavigate();
  const [dateValue, setDateValue] = useState("");
  const [hourValue, setHourValue] = useState("");
  const [minuteValue, setMinuteValue] = useState("");
  const [amPmValue, setAmPmValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Set initial time when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDateValue(now.toISOString().slice(0, 10));
      let hour = now.getHours();
      let ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      if (hour === 0) hour = 12;
      setHourValue(hour.toString().padStart(2, "0"));
      setMinuteValue(now.getMinutes().toString().padStart(2, "0"));
      setAmPmValue(ampm);
      setError("");
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError("");
    // Build the selected date/time
    let hour = parseInt(hourValue, 10);
    if (amPmValue === "PM" && hour !== 12) hour += 12;
    if (amPmValue === "AM" && hour === 12) hour = 0;
    const dateObj = new Date(dateValue);
    dateObj.setHours(hour);
    dateObj.setMinutes(parseInt(minuteValue, 10));
    dateObj.setSeconds(0);
    dateObj.setMilliseconds(0);
    const now = new Date();
    if (dateObj > now) {
      setError("Selected time cannot be in the future.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = type === "pickup"
        ? { pickupConfirmedAt: dateObj.toISOString() }
        : { deliveredAt: dateObj.toISOString() };
      await confirmFn(shipmentId, payload);
      if (type === "pickup") {
        navigate("/carrier/dashboard/active-shipments?tab=in-transit");
      } else if (type === "delivery") {
        navigate("/carrier/dashboard/pending-payments");
      } else {
        onClose();
      }
    } catch (err) {
      // Try to get error message from backend
      const msg = err?.response?.data?.message || err?.message || "Failed to confirm. Please try again.";
      toast.error(msg);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-white mb-4">
        {type === "pickup" ? "Confirm Pickup" : "Confirm Delivery"}
      </h2>
      <TimePicker
        label={type === "pickup" ? "Pickup Time" : "Delivery Time"}
        dateValue={dateValue}
        hourValue={hourValue}
        minuteValue={minuteValue}
        amPmValue={amPmValue}
        onDateChange={e => setDateValue(e.target.value)}
        onHourChange={e => setHourValue(e.target.value)}
        onMinuteChange={e => setMinuteValue(e.target.value)}
        onAmPmChange={e => setAmPmValue(e.target.value)}
        error={error}
        required
        size="md"
      />
      <div className="flex gap-3 mt-6">
        <Button
          variant="primary"
          size="md"
          loading={submitting}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
        <Button variant="ghost" size="md" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
