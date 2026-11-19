import React from 'react';
import { STATUS_CONFIG } from '../../utils/constants';

export const StatusBadge = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-md select-none tracking-wide
        ${config.bg} ${config.text} ${config.border}
        ${className}
      `}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
