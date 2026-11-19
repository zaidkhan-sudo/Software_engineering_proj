import React from 'react';

export const Table = ({ children, className = '', ...props }) => (
  <div className="w-full overflow-x-auto border border-slate-200 rounded-lg bg-white">
    <table className={`w-full text-left border-collapse text-sm ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHead = ({ children, className = '', ...props }) => (
  <thead className={`bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider ${className}`} {...props}>
    {children}
  </thead>
);

export const TableHeader = ({ children, className = '', ...props }) => (
  <th className={`px-4 py-3 font-semibold text-slate-700 text-xs tracking-wider whitespace-nowrap align-middle ${className}`} {...props}>
    {children}
  </th>
);

export const TableBody = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', isClickable = false, ...props }) => (
  <tr
    className={`
      transition-colors
      ${isClickable ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/70' : 'hover:bg-slate-50/50'}
      ${className}
    `}
    {...props}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td className={`px-4 py-3 text-slate-700 text-sm whitespace-nowrap align-middle ${className}`} {...props}>
    {children}
  </td>
);

export default Table;
