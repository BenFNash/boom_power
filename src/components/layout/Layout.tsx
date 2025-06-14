import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#00080A]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-primary-light" />
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#00080A]">
      <Navbar toggleSidebar={toggleSidebar} />
      
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="relative flex flex-1 flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto pt-16">
          {/* Backdrop for mobile sidebar */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
              onClick={toggleSidebar}
            />
          )}
          
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;