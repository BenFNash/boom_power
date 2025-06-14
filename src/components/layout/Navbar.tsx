import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import UserProfileModal from '../common/UserProfileModal';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // Get display name from user profile
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700/50 dark:bg-[#00080A]">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-black/20 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <img 
          src="/images/boom_power_logo-min.png" 
          alt="Boom Power"
          className="h-8"
        />
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        <button className="relative rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-black/20">
          <Bell size={20} />
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] text-white">
            5
          </span>
        </button>

        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-black/20"
          >
            <div className="flex items-center space-x-2 rounded-full p-2">
              <UserCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <div className="hidden text-sm md:block">
                {displayName}
              </div>
              <ChevronDown size={14} />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700/50 dark:bg-[#00080A]">
              <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-700/50">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setProfileModalOpen(true);
                  setDropdownOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-black/20"
              >
                View Profile
              </button>
              <button
                onClick={() => {
                  signOut();
                  setDropdownOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-black/20"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {user && (
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default Navbar;