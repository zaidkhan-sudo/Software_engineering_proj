import React from 'react';

export const PageHeader = ({
  title,
  description,
  breadcrumbs = null,
  actions = null,
  className = ''
}) => (
  <div className={`mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
    <div>
      {breadcrumbs && <div className="text-xs text-slate-500 mb-1">{breadcrumbs}</div>}
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2.5 flex-shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
