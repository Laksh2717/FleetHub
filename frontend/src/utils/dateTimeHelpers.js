export const convertTo24Hour = (hour, amPm) => {
  let hours = parseInt(hour);
  if (amPm === "PM" && hours !== 12) hours += 12;
  if (amPm === "AM" && hours === 12) hours = 0;
  return hours;
};

export const createDateTime = (dateStr, hour, minute, amPm) => {
  const date = new Date(dateStr);
  const hours24 = convertTo24Hour(hour, amPm);
  date.setHours(hours24, parseInt(minute), 0, 0);
  return date;
};

export const createISODateTime = (dateStr, hour, minute, amPm) => {
  const date = new Date(dateStr);
  const hours24 = convertTo24Hour(hour, amPm);
  date.setHours(hours24, parseInt(minute), 0, 0);
  return date.toISOString();
};
