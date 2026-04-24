export function getDeadlineBadge({ date, currentTime = Date.now(), type = 'closing' }) {
  if (!date) return { text: '', variant: 'neutral' };
  const deadline = typeof date === 'string' ? Date.parse(date) : date.getTime();
  const diffMs = deadline - currentTime;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  if (type === 'closing') {
    if (diffMs <= 0) return { text: 'Closed', variant: 'danger' };
    else if (diffDays > 1) return { text: `${diffDays} days left`, variant: 'info' };
    else if (diffDays === 1) return { text: '1 day left', variant: 'warning' };
    else if (diffHours <= 12) return { text: 'Closing Soon', variant: 'danger' };
    return { text: '1 day left', variant: 'warning' };
  }

  if (type === 'expiring') {
    if (diffMs <= 0) return { text: 'Expired', variant: 'danger' };
    else if (diffHours <= 12) return { text: 'Expiring Soon', variant: 'danger' };
    return { text: '', variant: 'neutral' };
  }
}