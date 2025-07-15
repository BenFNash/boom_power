import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../components/common/Button';
import TicketFilter from '../../components/tickets/TicketFilter';
import TicketList from '../../components/tickets/TicketList';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../lib/services/ticketService';
import { Ticket } from '../../types';

const ITEMS_PER_PAGE = 10;

const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalCount, setTotalCount] = useState(0);
  
  const hasAdminRole = user?.roles?.includes('admin');
  const hasEditRole = user?.roles?.includes('edit');
  const canEdit = hasAdminRole || hasEditRole;

  // Get current page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    loadTickets();
  }, [searchParams]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get filters from URL parameters
      const filters: Record<string, string> = {};
      const searchQuery = searchParams.get('search') || '';
      ['status', 'type', 'priority', 'site_id'].forEach(param => {
        const value = searchParams.get(param);
        if (value) {
          filters[param] = value;
        }
      });

      const response = await ticketService.getTickets(
        filters, 
        searchQuery,
        currentPage,
        ITEMS_PER_PAGE
      );
      
      setTickets(response.data);
      setTotalCount(response.count);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filters: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Clear existing filter params first
    ['status', 'type', 'priority', 'site_id'].forEach(param => {
      newParams.delete(param);
    });
    
    // Add new filter params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      }
    });
    
    // Reset to first page when filtering
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };

  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (query) {
      newParams.set('search', query);
    } else {
      newParams.delete('search');
    }
    
    // Reset to first page when searching
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tickets</h1>
          <p className="text-gray-500 dark:text-gray-300">Manage all your tickets in one place</p>
        </div>
        
        {canEdit && (
          <Link to="/tickets/new">
            <Button leftIcon={<Plus size={16} />} className="mt-4 sm:mt-0">
              Create Ticket
            </Button>
          </Link>
        )}
      </div>
      
      <TicketFilter onFilter={handleFilter} onSearch={handleSearch} />
      
      <TicketList tickets={tickets} loading={loading} error={error} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{totalCount}</span>{' '}
                results
              </p>
            </div>
            
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Button
                  variant="outline"
                  className="rounded-l-md"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'primary' : 'outline'}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === currentPage
                        ? 'z-10 bg-primary text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  className="rounded-r-md"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
