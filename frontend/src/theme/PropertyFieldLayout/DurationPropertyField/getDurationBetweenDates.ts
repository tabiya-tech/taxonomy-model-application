export function getDurationBetweenDates(firstDate: Date, secondDate: Date): string {
  const duration = getSafeDate(secondDate).getTime() - getSafeDate(firstDate).getTime();

  if (duration < 0) throw new Error("Invalid date range: First date must be before second date");

  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((duration % (1000 * 60)) / 1000);

  const output = [];

  if (days > 0) {
    output.push(days + " " + pluralize(days, "day"));
  }
  if (hours > 0) {
    output.push(hours + " " + pluralize(hours, "hour"));
  }
  if (minutes > 0) {
    output.push(minutes + " " + pluralize(minutes, "minute"));
  }
  if (seconds > 0) {
    output.push(seconds + " " + pluralize(seconds, "second"));
  }

  if(!output.length) return "0 seconds";
  return output.join(" ");
}

function pluralize(value: number, unit: string): string {
  return value === 1 ? unit : `${unit}s`;
}
// We need to ensure that the date is a valid Date object before we can use it.
// For example storybook's date input returns a string, so we need to convert it to a Date object.
function getSafeDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}
