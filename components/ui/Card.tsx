import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleAddon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleAddon }) => {
  return (
    <div className={`bg-white dark:bg-zap-card-blue border border-gray-200 dark:border-zap-border-blue rounded-lg p-4 sm:p-6 shadow-lg ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-zap-text-primary">{title}</h2>
            </div>
            {titleAddon}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;