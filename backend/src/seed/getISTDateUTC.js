export default function getISTDateUTC(year, month, day, hour, min) {
  // IST is UTC+5:30, so subtract 5h30m to get UTC time
  return new Date(Date.UTC(year, month - 1, day, hour - 5, min - 30));
}

