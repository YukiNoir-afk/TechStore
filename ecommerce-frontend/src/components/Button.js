import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  ...props
}) => {
  const baseStyles =
    'font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-lg active:translate-y-px focus:ring-primary-400',
    secondary: 'bg-primary-100 text-primary-600 hover:bg-primary-200 focus:ring-primary-300',
    danger: 'bg-gradient-to-r from-accent to-red-500 text-white hover:shadow-lg focus:ring-accent',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classNames = `${baseStyles} ${variants[variant]} ${sizes[size]} ${
    fullWidth ? 'w-full' : ''
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center space-x-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
