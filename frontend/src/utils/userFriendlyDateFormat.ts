const options: Intl.DateTimeFormatOptions = {
  weekday: "short", // "Mon" through "Sun"
  year: "numeric",
  month: "short", // "Jan" through "Dec"
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true, // Use 12-hour time format, use `false` for 24-hour format
  timeZoneName: "short", // "GMT", "CST", etc., remove this if you don't want to show the timezone
};

export const formattedDate = (date: Date) => new Intl.DateTimeFormat(navigator.language, options).format(date);
