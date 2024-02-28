const options: Intl.DateTimeFormatOptions = {
  weekday: "short", // "Mon" through "Sun"
  year: "numeric",
  month: "short", // "Jan" through "Dec"
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true, // Use 12-hour time format, use `false` for 24-hour format
};

export const formatDate = (date: Date) => new Intl.DateTimeFormat("en-us", options).format(date);
