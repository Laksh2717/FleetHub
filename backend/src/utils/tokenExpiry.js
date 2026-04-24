/**
 * Convert JWT expiry format (e.g., "3m", "7d", "24h") to milliseconds
 * @param {string} expiryString - Format like "3m", "7d", "24h"
 * @returns {number} Milliseconds
 */
export const expiryToMs = (expiryString) => {
  const match = expiryString.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiryString}`);
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    m: 60 * 1000,           // minutes to ms
    h: 60 * 60 * 1000,      // hours to ms
    d: 24 * 60 * 60 * 1000, // days to ms
  };
  
  return value * multipliers[unit];
};
