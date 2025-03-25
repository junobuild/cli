export const formatBytes = (bytes: number): string => {
  const unit = bytes >= 1000 ? 'megabyte' : 'kilobyte';

  const formatter = new Intl.NumberFormat('en', {
    style: 'unit',
    unit
  });

  return formatter.format(bytes / (unit === 'megabyte' ? 1_000_000 : 1_000));
};

export const formatTime = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};
