import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Users,
  Database,
  Mail,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTicketStore } from '../../lib/stores/ticketStore';

interface SidebarProps {
  isOpen: boolean;
}

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  count?: number;
  onClick?: () => void;
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, isActive, count, onClick }) => (
  <Link
    to={to}
    className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white dark:bg-primary-light dark:text-gray-900'
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-black/20'
    }`}
    onClick={onClick}
  >
    <span className="mr-3">{icon}</span>
    <span className="flex-1">{label}</span>
    {count !== undefined && (
      <span className={`rounded-full px-2 py-0.5 text-xs ${
        isActive 
          ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900' 
          : 'bg-gray-200 text-gray-700 dark:bg-black/20 dark:text-gray-300'
      }`}>
        {count}
      </span>
    )}
  </Link>
);

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        {title}
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isExpanded && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { ticketCounts, fetchTicketCounts } = useTicketStore();
  const isAdmin = user?.roles?.includes('admin');
  const canEdit = isAdmin || user?.roles?.includes('edit');

  useEffect(() => {
    fetchTicketCounts();
  }, [fetchTicketCounts]);

  return (
    <aside
      className={`fixed bottom-0 left-0 top-16 z-20 w-64 transform overflow-y-auto bg-white shadow-md transition-transform duration-300 ease-in-out dark:bg-[#00080A] lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4">
        <SidebarSection title="Dashboard">
          <SidebarItem
            to="/"
            icon={<LayoutDashboard size={18} />}
            label="Overview"
            isActive={location.pathname === '/'}
          />
        </SidebarSection>

        <SidebarSection title="Tickets">
          <SidebarItem
            to="/tickets"
            icon={<Ticket size={18} />}
            label="All Tickets"
            isActive={location.pathname === '/tickets' && !location.search}
            count={ticketCounts.total}
          />
          <SidebarItem
            to="/tickets?status=open"
            icon={<Clock size={18} />}
            label="Open Tickets"
            isActive={location.search === '?status=open'}
            count={ticketCounts.open + ticketCounts.assigned}
          />
          <SidebarItem
            to="/tickets?status=overdue"
            icon={<XCircle size={18} />}
            label="Overdue Tickets"
            isActive={location.search === '?status=overdue'}
            count={ticketCounts.overdue}
          />
          <SidebarItem
            to="/tickets?status=resolved"
            icon={<CheckCircle size={18} />}
            label="Resolved Tickets"
            isActive={location.search === '?status=resolved'}
            count={ticketCounts.resolved}
          />
        </SidebarSection>

        {isAdmin && (
          <SidebarSection title="Administration">
            <SidebarItem
              to="/admin/users"
              icon={<Users size={18} />}
              label="User Management"
              isActive={location.pathname === '/admin/users'}
            />
            <SidebarItem
              to="/admin/reference-data"
              icon={<Database size={18} />}
              label="Reference Data"
              isActive={location.pathname === '/admin/reference-data'}
            />
            <SidebarItem
              to="/admin/settings"
              icon={<Settings size={18} />}
              label="System Settings"
              isActive={location.pathname === '/admin/settings'}
            />
            <SidebarItem
              to="/admin/email-templates"
              icon={<Mail size={18} />}
              label="Email Templates"
              isActive={location.pathname === '/admin/email-templates'}
            />
          </SidebarSection>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;