import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({
  size = 'md',
  className = '',
  text,
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`} {...props}>
      <Loader2 className={`animate-spin ${sizes[size]}`} />
      {text && (
        <span className="ml-2 text-sm text-gray-600">{text}</span>
      )}
    </div>
  );
};

export default Spinner;
