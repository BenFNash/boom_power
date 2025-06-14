import React from 'react';
import Badge from '../common/Badge';
import { TicketStatus } from '../../types';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  showIndicator?: boolean;
  className?: string;
}

const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({
  status,
  showIndicator = true,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'open':
        return { variant: 'info' as const, label: 'Open' };
      case 'assigned':
        return { variant: 'warning' as const, label: 'Assigned' };
      case 'resolved':
        return { variant: 'success' as const, label: 'Resolved' };
      case 'cancelled':
        return { variant: 'error' as const, label: 'Cancelled' };
      case 'closed':
        return { variant: 'default' as const, label: 'Closed' };
      default:
        return { variant: 'default' as const, label: 'Unknown' };
    }
  };

  const { variant, label } = getStatusConfig();

  return (
    <Badge variant={variant} className={className}>
      {showIndicator && (
        <span className={`status-${status} mr-1.5`} />
      )}
      {label}
    </Badge>
  );
};

export default TicketStatusBadge;