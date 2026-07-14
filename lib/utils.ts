export const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    default:
      return "₹";
  }
};

const TIMEZONE = 'UTC';

export const formatTime = (timestamp: any, options?: Intl.DateTimeFormatOptions) => {
  const date = timestamp?.toDate?.() || new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    ...options,
  }).replace(' ', '');
};

export const formatShortDate = (timestamp: any) => {
  const date = timestamp?.toDate?.() || new Date(timestamp);
  const day = date.toLocaleDateString('en-US', {
    timeZone: TIMEZONE,
    day: 'numeric',
  });
  const month = date.toLocaleDateString('en-US', {
    timeZone: TIMEZONE,
    month: 'short',
  });
  return `${month} ${day}`;
};

export const formatEventDateTime = (timestamp: any) => {
  return `${formatShortDate(timestamp)}, ${formatTime(timestamp)}`;
};
