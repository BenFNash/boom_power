import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock } from 'lucide-react';
import Card from '../common/Card';
import TicketStatusBadge from './TicketStatusBadge';
import TicketTypeBadge from './TicketTypeBadge';
import { Ticket } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface TicketCardProps {
  ticket: Ticket;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const isOverdue = new Date(ticket.targetCompletionDate) < new Date();
  
  const detailsUrl = `/tickets/${ticket.id}`;

  return (
    <Card className="cursor-pointer transition-all hover:border-primary dark:hover:border-primary-light">
      <Link to={detailsUrl} className="block h-full w-full">
      <Card.Header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TicketTypeBadge type={ticket.type} />
          <Card.Title className="text-base dark:text-gray-200">{ticket.ticketNumber}</Card.Title>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </Card.Header>
      
      <Card.Content>
        <h4 className="mb-2 line-clamp-1 font-medium text-gray-900 dark:text-gray-100">{ticket.subject}</h4>
        <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{ticket.description}</p>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Site</p>
            <p className="font-medium text-gray-900 dark:text-gray-200">{ticket.site}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Priority</p>
            <p className="font-medium text-gray-900 dark:text-gray-200">{ticket.priority}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Assigned To</p>
            <p className="font-medium text-gray-900 dark:text-gray-200">{ticket.companyToAssign}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Raised By</p>
            <p className="font-medium text-gray-900 dark:text-gray-200">{ticket.whoRaised}</p>
          </div>
        </div>
      </Card.Content>
      
      <Card.Footer className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center">
          <Clock size={14} className="mr-1" />
          <span>
            {formatDistanceToNow(new Date(ticket.dateRaised), { addSuffix: true })}
          </span>
        </div>
        
        {isOverdue && ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
          <div className="flex items-center text-error dark:text-error/80">
            <AlertCircle size={14} className="mr-1" />
            <span>Overdue</span>
          </div>
        )}
      </Card.Footer>
      </Link>
    </Card>
  );
};

export default TicketCard;