export const shipmentCapacity = (weight, volume) => {
  if (weight > 0 && volume > 0) {
    return `${weight} Tons / ${volume} Litres`;
  }
  if (weight > 0) {
    return `${weight} Tons`;
  }
  if (volume > 0) {
    return `${volume} Litres`;
  }
  return null;
};
