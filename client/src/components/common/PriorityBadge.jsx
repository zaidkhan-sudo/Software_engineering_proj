import React from 'react';
import { PRIORITY_CONFIG } from '../../utils/constants';

export const PriorityBadge = ({ priority, className = '' }) => {
  const normPriority = (priority || 'medium').toLowerCase();
  const config = PRIORITY_CONFIG[normPriority] || PRIORITY_CONFIG.medium;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded-md select-none
        ${config.bg} ${config.text} ${config.border}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;
