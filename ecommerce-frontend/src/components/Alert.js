import React from 'react';

const Alert = ({ type = 'info', message, onClose }) => {
  const bgColors = {
    success: 'bg-success bg-opacity-10 border-success text-success',
    error: 'bg-accent bg-opacity-10 border-accent text-accent',
    warning: 'bg-warning bg-opacity-10 border-warning text-warning',
    info: 'bg-primary-100 border-primary-500 text-primary-600',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`border-l-4 ${bgColors[type]} p-4 rounded-r-lg flex items-start space-x-3 animate-slideDown`}>
      <span className="text-xl font-bold flex-shrink-0">{icons[type]}</span>
      <div className="flex-grow">
        <p className="font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-lg font-bold hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
