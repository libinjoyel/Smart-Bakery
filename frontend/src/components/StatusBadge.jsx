function StatusBadge({ status }) {
  const label = String(status || 'Safe');
  const colorClass = label.toLowerCase().includes('critical')
    ? 'status-critical'
    : label.toLowerCase().includes('warning')
      ? 'status-warning'
      : 'status-safe';

  return <span className={`status-badge ${colorClass}`}>{label}</span>;
}

export default StatusBadge;
