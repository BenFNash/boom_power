import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import Button from '../common/Button';
import { useSearchParams } from 'react-router-dom';
import { useReferenceDataStore } from '../../lib/stores/referenceDataStore';

interface FilterOption {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

interface TicketFilterProps {
  onFilter: (filters: Record<string, string>) => void;
  onSearch: (query: string) => void;
  hideSiteFilter?: boolean;
}

const TicketFilter: React.FC<TicketFilterProps> = ({ onFilter, onSearch, hideSiteFilter }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { sites, loading: sitesLoading, fetchSites } = useReferenceDataStore();

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'closed', label: 'Closed' },
        { value: 'overdue', label: 'Overdue' },
      ],
    },
    {
      id: 'type',
      label: 'Type',
      options: [
        { value: 'job', label: 'Job' },
        { value: 'fault', label: 'Fault' },
      ],
    },
    {
      id: 'priority',
      label: 'Priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ],
    },
    // Only include the site filter if not hidden
    ...(!hideSiteFilter
      ? [{
          id: 'site_id',
          label: 'Site',
          options: sites.map(site => ({
            value: site.id,
            label: site.siteName
          }))
        }]
      : []),
  ];

  // Initialize filters from URL params
  useEffect(() => {
    const newFilters: Record<string, string> = {};
    filterOptions.forEach(option => {
      const value = searchParams.get(option.id);
      if (value) {
        newFilters[option.id] = value;
      }
    });
    setFilters(newFilters);

    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleFilterChange = (filterId: string, value: string) => {
    const newFilters = { ...filters, [filterId]: value };
    setFilters(newFilters);
    onFilter(newFilters);
    setActiveFilter(null);
  };

  const handleRemoveFilter = (filterId: string) => {
    const newFilters = { ...filters };
    delete newFilters[filterId];
    setFilters(newFilters);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(filterId);
    setSearchParams(newParams);
    
    onFilter(newFilters);
  };

  const handleClearAll = () => {
    setFilters({});
    setSearchQuery('');
    setSearchParams(new URLSearchParams());
    onFilter({});
    onSearch('');
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilter(activeFilter === filterId ? null : filterId);
  };

  const getFilterLabel = (filterId: string, value: string) => {
    const filterOption = filterOptions.find(f => f.id === filterId);
    return filterOption?.options.find(o => o.value === value)?.label || value;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tickets..."
            className="input pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="primary"
          className="shrink-0"
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <Filter className="mr-2 h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">Filters:</span>
        </div>

        {filterOptions.map((filterOption) => (
          <div key={filterOption.id} className="relative">
            <button
              onClick={() => toggleFilter(filterOption.id)}
              className={`flex items-center rounded-md border px-3 py-1.5 text-sm ${
                filters[filterOption.id]
                  ? 'border-primary bg-primary/10 text-primary dark:border-primary-light dark:bg-primary/20 dark:text-primary-light'
                  : 'border-gray-700/50 bg-black/20 text-gray-800 dark:text-gray-300 hover:bg-black/30'
              }`}
            >
              {filterOption.label}
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>

            {activeFilter === filterOption.id && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-700/50 bg-[#00080A] py-1 shadow-lg">
                {filterOption.options.map((option) => (
                  <button
                    key={option.value}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      filters[filterOption.id] === option.value
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                        : 'text-gray-300 hover:bg-black/20'
                    }`}
                    onClick={() => handleFilterChange(filterOption.id, option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filters).length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Clear all
          </button>
        )}
      </div>

      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-primary dark:bg-primary/20 dark:text-primary-light"
            >
              <span className="font-medium">{filterOptions.find(f => f.id === key)?.label}: </span>
              <span className="ml-1">{getFilterLabel(key, value)}</span>
              <button
                onClick={() => handleRemoveFilter(key)}
                className="ml-1.5 rounded-full p-0.5 hover:bg-primary/20 dark:hover:bg-primary/30"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketFilter;
