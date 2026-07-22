import React from 'react';

const Badge = ({ children, variant = 'primary', size = 'md' }) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success bg-opacity-10 text-success',
    warning: 'bg-warning bg-opacity-10 text-warning',
    danger: 'bg-accent bg-opacity-10 text-accent',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-block rounded-full font-semibold ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

export default Badge;
