import React from 'react';
import { PRIORITY_CONFIG } from '../../utils/constants';

export const PriorityBadge = ({ priority, className = '' }) => {
  const normPriority = (priority || 'medium').toLowerCase();
  const config = PRIORITY_CONFIG[normPriority] || PRIORITY_CONFIG.medium;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-md select-none tracking-wide
        ${config.bg} ${config.text} ${config.border}
        ${className}
      `}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;
