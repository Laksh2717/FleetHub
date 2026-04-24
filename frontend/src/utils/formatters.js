// Format date as '24 Jan, 09:00 am' (no year)
export const formatShortDateTime = (value, locale = "en-IN") => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const dayMonth = date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });
  const time = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dayMonth}, ${time}`;
};
// Shared formatting helpers for UI rendering
// These are safe to use across shipper/carrier pages and feature components.

export const formatDate = (value, locale = "en-IN") => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value, locale = "en-IN") => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatCurrency = (value, currency = "INR", locale = "en-IN") => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(value));
};

export const formatAddress = (loc = {}) => {
  if (!loc || typeof loc !== "object") return "-";
  return [loc.street, loc.city, loc.state, loc.pincode].filter(Boolean).join(", ") || "-";
};

export const formatVehicleType = (type) => {
  if (!type) return "-";
  return String(type)
    .toLowerCase()
    .split("_")
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" ");
};

export const capitalizeWords = (str) => {
  if (!str || typeof str !== "string") return "-";
  return str
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const formatNotificationTime = (timestamp) => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};