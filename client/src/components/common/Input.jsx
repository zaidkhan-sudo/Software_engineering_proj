import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  helperText,
  icon: Icon = null,
  required = false,
  className = '',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`
            w-full h-10 bg-white border rounded-md text-sm text-slate-900 transition-colors
            placeholder:text-slate-400
            focus:outline-none focus:ring-2
            ${Icon ? 'pl-9 pr-3' : 'px-3'}
            ${error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 focus:border-primary-600 focus:ring-primary-600/20 hover:border-slate-400'}
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-normal leading-tight">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
