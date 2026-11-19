import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-white border border-slate-200 rounded-lg ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div
    className={`px-6 py-4 border-b border-slate-100 flex flex-col space-y-1 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3
    className={`text-base font-semibold text-slate-900 leading-snug ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p
    className={`text-xs text-slate-500 leading-relaxed ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div
    className={`px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between rounded-b-lg ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
