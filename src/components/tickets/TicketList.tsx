import React from 'react';
import TicketCard from './TicketCard';
import { Ticket } from '../../types';
import { LayoutList, AlertCircle } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  loading?: boolean;
  error?: string | null;
}

const TicketList: React.FC<TicketListProps> = ({ 
  tickets, 
  loading = false,
  error = null 
}) => {
  if (loading) {
    return (
      <div className="mt-6 grid gap-4 animate-pulse">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-1 h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="mb-1 h-3 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-error/20 bg-error/10 p-4 text-error dark:border-error/10 dark:bg-error/20">
        <div className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          <p>Error loading tickets: {error}</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <LayoutList className="mb-2 h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-gray-100">No tickets found</h3>
        <p className="text-gray-500 dark:text-gray-400">There are no tickets matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
};

export default TicketList;