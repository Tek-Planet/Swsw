/**
 * Format a date/timestamp using UTC to prevent timezone inconsistencies.
 */

const TIMEZONE = 'UTC';

export const formatDate = (timestamp: any, options?: Intl.DateTimeFormatOptions) => {
  const date = timestamp?.toDate?.() || new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    timeZone: TIMEZONE,
    ...options,
  });
};

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

export const formatEventDate = (startTime: any, endTime?: any) => {
  const startDate = startTime?.toDate?.() || new Date(startTime);

  if (!endTime) {
    return `${formatEventDateTime(startTime)} Onwards`;
  }

  const endDate = endTime?.toDate?.() || new Date(endTime);

  const isSameDay =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
    startDate.getUTCMonth() === endDate.getUTCMonth() &&
    startDate.getUTCDate() === endDate.getUTCDate();

  if (isSameDay) {
    return `${formatShortDate(startTime)}, ${formatTime(startTime)} Onwards`;
  }

  return `${formatShortDate(startTime)} to ${formatShortDate(endTime)}`;
};

export const formatLongDate = (timestamp: any) => {
  return formatDate(timestamp, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
