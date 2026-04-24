export const getStatusBadge = (status) => {
  switch (status) {
    case "AVAILABLE":
      return { text: "Available", variant: "success"};
    case "IN_USE":
      return { text: "In Use", variant: "info"};
    case "RETIRED":
      return { text: "Retired", variant: "neutral"};
    case "BIDDED":
      return { text: "Bidded", variant: "warning"};
    case "ASSIGNED":
      return { text: "Assigned", variant: "info"};
    case "IN_TRANSIT":
      return { text: "In Transit", variant: "purple"};
    case "DELIVERED":
      return { text: "Delivered", variant: "warning"};
    case "EXPIRED":
      return { text: "Expired", variant: "neutral"};
    case "COMPLETED":
      return { text: "Completed", variant: "success"};
    case "PENDING_PAYMENT":
      return { text: "Pending Payment", variant: "warning"};
    case "PAYMENT_PENDING":
      return { text: "Payment Pending", variant: "danger"};
    case "UNASSIGNED":
      return { text: "Unassigned", variant: "warning"};
    case "PICKUP_PENDING":
      return { text: "Pickup Pending", variant: "info"};
    default:
      return { text: status, variant: "neutral"};
  }
};