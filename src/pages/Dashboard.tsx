import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  LineChart,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import TicketList from '../components/tickets/TicketList';
import { useAuth } from '../context/AuthContext';
import { useTicketStore } from '../lib/stores/ticketStore';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    tickets = [], 
    ticketCounts,
    isLoading: loading, 
    error, 
    fetchTickets,
    fetchTicketCounts 
  } = useTicketStore();

  const isAdmin = user?.roles?.includes('admin');
  const canEdit = isAdmin || user?.roles?.includes('edit');

  useEffect(() => {
    fetchTickets();
    fetchTicketCounts();
  }, [fetchTickets, fetchTicketCounts]);

  // Filter tickets by status with safety checks
  const openTickets = Array.isArray(tickets) 
    ? tickets.filter(t => t.status === 'open' || t.status === 'assigned')
    : [];
    
  const overdueTickets = Array.isArray(tickets)
    ? tickets.filter(t => 
        new Date(t.targetCompletionDate) < new Date() && 
        (t.status === 'open' || t.status === 'assigned')
      )
    : [];

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back, {displayName}!</p>
        </div>
        
        {canEdit && (
          <Link to="/tickets/new">
            <Button leftIcon={<Plus size={16} />} className="mt-4 sm:mt-0">
              Create Ticket
            </Button>
          </Link>
        )}
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/tickets" className="block">
          <Card className="flex h-full cursor-pointer items-center overflow-hidden transition-all hover:border-primary dark:hover:border-primary-light">
            <div className="flex h-full w-16 items-center justify-center bg-primary/10 dark:bg-primary/20">
              <ClipboardList className="h-6 w-6 text-primary dark:text-primary-light" />
            </div>
            <div className="flex-1 p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticketCounts.total}</p>
            </div>
          </Card>
        </Link>

        <Link to="/tickets?status=open" className="block">
          <Card className="flex h-full cursor-pointer items-center overflow-hidden transition-all hover:border-warning dark:hover:border-warning">
            <div className="flex h-full w-16 items-center justify-center bg-warning/10 dark:bg-warning/20">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1 p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {ticketCounts.open + ticketCounts.assigned}
              </p>
            </div>
          </Card>
        </Link>
        
        <Link to="/tickets?status=overdue" className="block">
          <Card className="flex h-full cursor-pointer items-center overflow-hidden transition-all hover:border-error dark:hover:border-error">
            <div className="flex h-full w-16 items-center justify-center bg-error/10 dark:bg-error/20">
              <AlertTriangle className="h-6 w-6 text-error" />
            </div>
            <div className="flex-1 p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticketCounts.overdue}</p>
            </div>
          </Card>
        </Link>
        
        <Link to="/tickets?status=resolved" className="block">
          <Card className="flex h-full cursor-pointer items-center overflow-hidden transition-all hover:border-success dark:hover:border-success">
            <div className="flex h-full w-16 items-center justify-center bg-success/10 dark:bg-success/20">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1 p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticketCounts.resolved}</p>
            </div>
          </Card>
        </Link>
      </div>
      
      {/* Chart */}
      <Card>
        <Card.Header className="flex items-center justify-between">
          <Card.Title>Ticket Status Overview</Card.Title>
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center">
              <span className="mr-1.5 h-3 w-3 rounded-full bg-primary dark:bg-primary-light"></span>
              <span className="text-gray-700 dark:text-gray-300">Open</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1.5 h-3 w-3 rounded-full bg-warning"></span>
              <span className="text-gray-700 dark:text-gray-300">Assigned</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1.5 h-3 w-3 rounded-full bg-success"></span>
              <span className="text-gray-700 dark:text-gray-300">Resolved</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1.5 h-3 w-3 rounded-full bg-gray-400"></span>
              <span className="text-gray-700 dark:text-gray-300">Closed</span>
            </div>
          </div>
        </Card.Header>
        
        <Card.Content>
          <div className="flex h-48 items-center justify-center">
            <LineChart className="h-24 w-24 text-gray-400 dark:text-gray-600" />
            <p className="ml-4 text-gray-500 dark:text-gray-400">Chart visualization will be implemented here</p>
          </div>
        </Card.Content>
      </Card>
      
      {/* Recent Tickets */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Open Tickets</h2>
          <Link to="/tickets" className="text-sm font-medium text-primary hover:underline dark:text-primary-light">
            View All Tickets
          </Link>
        </div>
        
        <TicketList tickets={openTickets.slice(0, 3)} loading={loading} error={error} />
      </div>
      
      {/* Overdue Tickets */}
      {overdueTickets.length > 0 && (
        <div>
          <div className="mb-4 flex items-center">
            <XCircle className="mr-2 h-5 w-5 text-error" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Overdue Tickets</h2>
          </div>
          
          <TicketList tickets={overdueTickets.slice(0, 3)} loading={loading} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;