import React from 'react';
import { TicketType } from '../../types';

interface TicketTypeBadgeProps {
  type: TicketType;
  className?: string;
}

const TicketTypeBadge: React.FC<TicketTypeBadgeProps> = ({ type, className = '' }) => {
  const badgeClass = type === 'job' ? 'ticket-type-job' : 'ticket-type-fault';
  
  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {type === 'job' ? 'Job' : 'Fault'}
    </span>
  );
};

export default TicketTypeBadge;