export const ROLES = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  ADMIN: 'admin'
};

export const STATUSES = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED'
};

export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const STATUS_CONFIG = {
  SUBMITTED: {
    label: 'Submitted',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  RESOLVED: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200'
  },
  REOPENED: {
    label: 'Reopened',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200'
  }
};

export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200'
  },
  medium: {
    label: 'Medium',
    dot: 'bg-sky-500',
    text: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200'
  },
  high: {
    label: 'High',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  urgent: {
    label: 'Urgent',
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200'
  }
};


export const VALID_TRANSITIONS = {
  SUBMITTED: [STATUSES.UNDER_REVIEW],
  UNDER_REVIEW: [STATUSES.IN_PROGRESS, STATUSES.REJECTED],
  IN_PROGRESS: [STATUSES.RESOLVED, STATUSES.REJECTED],
  RESOLVED: [STATUSES.REOPENED],
  REJECTED: [STATUSES.REOPENED],
  REOPENED: [STATUSES.UNDER_REVIEW]
};

// Officer/Admin transitions (excluding citizen-only REOPENED)
export const OFFICER_ALLOWED_TRANSITIONS = {
  SUBMITTED: [STATUSES.UNDER_REVIEW],
  UNDER_REVIEW: [STATUSES.IN_PROGRESS, STATUSES.REJECTED],
  IN_PROGRESS: [STATUSES.RESOLVED, STATUSES.REJECTED],
  REOPENED: [STATUSES.UNDER_REVIEW],
  RESOLVED: [],
  REJECTED: []
};
