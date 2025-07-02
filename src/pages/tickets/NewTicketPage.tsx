import React from 'react';
import TicketForm from '../../components/tickets/TicketForm';
import { Ticket } from '../../types';
import { useTicketStore } from '../../lib/stores/ticketStore';
import toast from 'react-hot-toast';

const NewTicketPage: React.FC = () => {
  const { createTicket, loading } = useTicketStore();
  
  const handleSubmit = async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createTicket(ticketData);
      toast.success('Ticket created successfully!');
      // Get the latest reference to fetchTicketCounts from the store
      await useTicketStore.getState().fetchTicketCounts();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket. Please try again.');
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Fault Ticket</h1>
      <TicketForm onSubmit={handleSubmit} isLoading={loading} />
    </div>
  );
};

export default NewTicketPage;
