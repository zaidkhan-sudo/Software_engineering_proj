import React, { forwardRef } from 'react';

export const Textarea = forwardRef(({
  label,
  id,
  error,
  helperText,
  required = false,
  maxLength,
  value,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-700"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="text-xs text-slate-400">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        required={required}
        className={`
          w-full px-3 py-2 bg-white border rounded-md text-base text-slate-900 transition-colors
          placeholder:text-slate-400 resize-y
          focus:outline-none focus:ring-2
          ${error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 focus:border-primary-600 focus:ring-primary-600/20 hover:border-slate-400'}
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />

      {error ? (
        <p className="text-sm text-rose-600 font-normal leading-tight">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-slate-500 leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
