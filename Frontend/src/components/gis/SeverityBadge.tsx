import React from 'react';
import { getSeverityColorClass } from '../../utils/sensorHelpers';

interface SeverityBadgeProps {
  level: string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ level, className = '' }) => {
  const colorClass = getSeverityColorClass(level);
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase border ${colorClass} ${className}`}>
      {level}
    </span>
  );
};
