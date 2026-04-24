export function getEstimatedDeliveryDate(shipment) {
	if (!shipment?.pickupConfirmedAt || !shipment?.estimatedTransitHours) return null;
	const pickup = new Date(shipment.pickupConfirmedAt);
	const hours = Number(shipment.estimatedTransitHours);
	if (Number.isNaN(pickup.getTime()) || Number.isNaN(hours)) return null;
	return new Date(pickup.getTime() + hours * 60 * 60 * 1000);
}

export function getShipmentBadge(shipment, tab, currentTime) {
	if (!shipment) return { text: null, variant: "info" };
	let text = null;
	if (tab === "assigned") text = "Assigned";
	else if (tab === "in-transit") {
		const eta = getEstimatedDeliveryDate(shipment);
		if (!eta) return { text: null, variant: "info" };
		text = currentTime > eta.getTime() ? "Delayed" : "On Time";
	}
	let variant = "info";
	if (text === "Delayed") variant = "danger";
	else if (text === "On Time") variant = "success";
	return { text, variant };
}
