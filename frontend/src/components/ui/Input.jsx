import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';
  const disabledClasses = props.disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  
  const inputClasses = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`;

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
