import React from 'react';

export const PriorityBadge = ({ priority }) => {
  const norm = (priority || 'MEDIUM').toUpperCase();

  let badgeClass = 'badge-medium';
  if (norm === 'URGENT') badgeClass = 'badge-urgent badge-pulse';
  else if (norm === 'HIGH') badgeClass = 'badge-high';
  else if (norm === 'LOW') badgeClass = 'badge-low';

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      {norm}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const norm = (status || 'OPEN').toUpperCase();

  let badgeClass = 'badge-open badge-pulse';
  let label = 'Open';

  if (norm === 'IN_PROGRESS') {
    badgeClass = 'badge-progress badge-pulse';
    label = 'In Progress';
  } else if (norm === 'RESOLVED') {
    badgeClass = 'badge-resolved';
    label = 'Resolved';
  } else if (norm === 'CLOSED') {
    badgeClass = 'badge-closed';
    label = 'Closed';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  if (!role) return null;
  const norm = role.toUpperCase();

  let style = {
    background: 'var(--bg-sage-soft)',
    color: 'var(--text-heading)',
    border: '1px solid var(--border)'
  };

  if (norm === 'SUPER_ADMIN') {
    style = {
      background: 'rgba(232, 119, 63, 0.15)',
      color: 'var(--accent)',
      border: '1px solid rgba(232, 119, 63, 0.35)',
      fontWeight: 700
    };
  } else if (norm === 'SUPPORT_LEAD') {
    style = {
      background: 'var(--bg-sage-soft)',
      color: 'var(--primary)',
      border: '1px solid rgba(74, 107, 80, 0.25)'
    };
  } else if (norm === 'SUPPORT_ENGINEER') {
    style = {
      background: 'var(--bg-sage-soft)',
      color: 'var(--primary-dark)',
      border: '1px solid rgba(74, 107, 80, 0.25)'
    };
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        ...style
      }}
    >
      {norm.replace(/_/g, ' ')}
    </span>
  );
};

export const Badge = ({ type = 'role', value, ...props }) => {
  if (type === 'priority') return <PriorityBadge priority={value} {...props} />;
  if (type === 'status') return <StatusBadge status={value} {...props} />;
  return <RoleBadge role={value} {...props} />;
};

export default Badge;

