import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Building, 
  MapPin,
  Clock,
  Edit,
  CheckCircle,
  XCircle,
  Download,
  Users,
  File
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketTypeBadge from '../../components/tickets/TicketTypeBadge';
import TicketForm from '../../components/tickets/TicketForm';
import CommunicationThread from '../../components/communications/CommunicationThread';
import { TicketStatus, Ticket } from '../../types';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../lib/services/ticketService';
import { useCommunicationStore } from '../../lib/stores/communicationStore';
import toast from 'react-hot-toast';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(false);
  
  const { 
    communications, 
    loading: commLoading, 
    error: commError, 
    fetchCommunications,
    createCommunication 
  } = useCommunicationStore();
  
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [sendingMessage, setSendingMessage] = React.useState(false);

  const hasAdminRole = user?.roles?.includes('admin');
  const hasEditRole = user?.roles?.includes('edit');
  const canEdit = hasAdminRole || hasEditRole;
  const canCloseCancel = canEdit;

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const ticketData = await ticketService.getTicketById(id);
        setTicket(ticketData);
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCommunications(id);
    }
  }, [id, fetchCommunications]);

  const handleSendMessage = async (message: string, files: File[]) => {
    if (!id || !user) return;
    
    try {
      setSendingMessage(true);
      
      await createCommunication({
        ticketId: id,
        userId: user.id,
        message,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        attachments: []
      });
      
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!ticket || !id) return;
    
    try {
      setUpdatingStatus(true);
      const updatedTicket = await ticketService.updateTicket(id, { status: newStatus });
      setTicket(updatedTicket);
      toast.success(`Ticket ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} successfully`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEditTicket = async (ticketData: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => {
    if (!ticket || !id) return;
    
    try {
      setUpdatingTicket(true);
      const updatedTicket = await ticketService.updateTicket(id, ticketData);
      setTicket(updatedTicket);
      setIsEditModalOpen(false);
      toast.success('Ticket updated successfully');
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket. Please try again.');
      throw error;
    } finally {
      setUpdatingTicket(false);
    }
  };

  if (loading || commLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent dark:border-primary-light"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mt-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {error || 'Ticket not found'}
        </h2>
        <Button
          onClick={() => navigate('/tickets')}
          className="mt-4"
          variant="outline"
        >
          Back to Tickets
        </Button>
      </div>
    );
  }

  const isOverdue = new Date(ticket.targetCompletionDate) < new Date() && 
    (ticket.status === 'open' || ticket.status === 'assigned');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div className="flex items-center">
          <h1 className="mr-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {ticket.ticketNumber}: {ticket.subject}
          </h1>
          <TicketStatusBadge status={ticket.status} />
        </div>
        
        <div className="mt-4 flex space-x-3 sm:mt-0">
          {canEdit && ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
            <Button
              variant="outline"
              leftIcon={<Edit size={16} />}
              onClick={() => setIsEditModalOpen(true)}
              disabled={updatingStatus}
            >
              Edit
            </Button>
          )}
          
          {canCloseCancel && ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
            <>
              <Button
                variant="outline"
                leftIcon={<XCircle size={16} />}
                onClick={() => handleUpdateStatus('cancelled')}
                disabled={updatingStatus}
                loading={updatingStatus && ticket.status !== 'cancelled'}
              >
                Cancel
              </Button>
              
              <Button
                leftIcon={<CheckCircle size={16} />}
                onClick={() => handleUpdateStatus('closed')}
                disabled={updatingStatus}
                loading={updatingStatus && ticket.status === 'cancelled'}
              >
                Close
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <Card.Header className="flex items-center justify-between">
              <Card.Title>Ticket Details</Card.Title>
              <TicketTypeBadge type={ticket.type} />
            </Card.Header>
            
            <Card.Content>
              <div className="mb-6 whitespace-pre-wrap text-gray-700 dark:text-gray-300">{ticket.description}</div>
              
              {isOverdue && (
                <div className="mb-6 rounded-md bg-error/10 p-3 text-sm text-error dark:bg-error/20">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    <span className="font-medium">Overdue!</span>
                  </div>
                  <p className="mt-1">
                    This ticket is past its target completion date of {format(new Date(ticket.targetCompletionDate), 'PPP')}.
                  </p>
                </div>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Site</p>
                  <p className="mt-1 flex items-center font-medium text-gray-900 dark:text-gray-100">
                    <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    {ticket.site}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Site Owner</p>
                  <p className="mt-1 flex items-center font-medium text-gray-900 dark:text-gray-100">
                    <Building className="mr-1.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    {ticket.siteOwner}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{ticket.priority}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date Raised</p>
                  <p className="mt-1 flex items-center font-medium text-gray-900 dark:text-gray-100">
                    <Calendar className="mr-1.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    {format(new Date(ticket.dateRaised), 'PP')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Target Completion</p>
                  <p className="mt-1 flex items-center font-medium text-gray-900 dark:text-gray-100">
                    <Calendar className="mr-1.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    {format(new Date(ticket.targetCompletionDate), 'PP')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Raised By</p>
                  <p className="mt-1 flex items-center font-medium text-gray-900 dark:text-gray-100">
                    <User className="mr-1.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    {ticket.whoRaised}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Assigned To</p>
                  <p className="mt-1 flex items-center font-medium text-gray-900 dark:text-gray-100">
                    <Building className="mr-1.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    {ticket.companyToAssign}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Company Contact</p>
                  <p className="mt-1 flex items-center font-medium text-gray-900 dark:text-gray-100">
                    <Users className="mr-1.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    {ticket.companyContact}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  variant="outline"
                  leftIcon={<Download size={16} />}
                  className="text-sm"
                >
                  Export Ticket Details
                </Button>
              </div>
            </Card.Content>
          </Card>
          
          <div className="mt-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Communications</h2>
            <Card className="h-[600px] overflow-hidden">
              <CommunicationThread
                communications={communications}
                currentUser={user}
                ticketId={ticket.id}
                onSendMessage={handleSendMessage}
                isLoading={sendingMessage}
              />
            </Card>
          </div>
        </div>
        
        <div>
          <Card>
            <Card.Header>
              <Card.Title>Activity Timeline</Card.Title>
            </Card.Header>
            
            <Card.Content>
              <div className="relative min-h-[200px] space-y-4">
                <div className="absolute left-1.5 top-4 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
                <div className="relative pl-6 z-10">
                  <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary dark:bg-primary-light z-10"></div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ticket Created</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(ticket.createdAt), 'PPp')} by {ticket.whoRaised}
                  </p>
                </div>
                {communications.map((comm) => (
                  <div key={comm.id} className="relative pl-6 z-10">
                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary dark:bg-primary-light z-10"></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Comment Added</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(comm.createdAt), 'PPp')} by {comm.user.firstName} {comm.user.lastName}
                    </p>
                  </div>
                ))}
                {ticket.status === 'closed' && (
                  <div className="relative pl-6 z-10">
                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-success z-10"></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ticket Closed</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.updatedAt), 'PPp')}
                    </p>
                  </div>
                )}
                {ticket.status === 'cancelled' && (
                  <div className="relative pl-6 z-10">
                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-error z-10"></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ticket Cancelled</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.updatedAt), 'PPp')}
                    </p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
          
          <Card className="mt-6">
            <Card.Header>
              <Card.Title>Related Documents</Card.Title>
            </Card.Header>
            
            <Card.Content>
              <div className="space-y-3">
                {communications.flatMap((comm) => 
                  comm.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                        <File className="h-5 w-5" />
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{attachment.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB • 
                          {format(new Date(attachment.createdAt), 'PP')}
                        </p>
                      </div>
                    </a>
                  ))
                )}
                
                {communications.flatMap((comm) => comm.attachments).length === 0 && (
                  <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No documents attached to this ticket yet
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Edit Ticket Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Ticket"
        size="xl"
      >
        <TicketForm
          initialData={ticket}
          onSubmit={handleEditTicket}
          isLoading={updatingTicket}
        />
      </Modal>
    </div>
  );
};

export default TicketDetailPage;