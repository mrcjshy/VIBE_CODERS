import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Icons for sidebar
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ProductIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const StatisticIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SettingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    // Navigate to login page is handled by protected routes
  };
  
  return (
    <div className="bg-green-500 text-white h-screen w-48 fixed left-0 top-0 flex flex-col">
      <div className="p-4 flex justify-center">
        <div className="rounded-full bg-purple-100 p-2 w-24 h-24 flex items-center justify-center">
          <span className="text-purple-700 text-xl font-bold">Baa Baa</span>
        </div>
      </div>
      
      <nav className="flex flex-col mt-6">
        <Link 
          to="/dashboard" 
          className={`flex items-center p-4 hover:bg-green-600 ${location.pathname === '/dashboard' ? 'bg-green-600' : ''}`}
        >
          <HomeIcon />
          <span className="ml-3">Home</span>
        </Link>
        
        <Link 
          to="/inventory" 
          className={`flex items-center p-4 hover:bg-green-600 ${location.pathname === '/inventory' ? 'bg-green-600' : ''}`}
        >
          <ProductIcon />
          <span className="ml-3">Product</span>
          {location.pathname === '/inventory' && (
            <span className="ml-2 h-2 w-2 bg-white rounded-full"></span>
          )}
        </Link>
        
        <Link 
          to="/statistics" 
          className={`flex items-center p-4 hover:bg-green-600 ${location.pathname === '/statistics' ? 'bg-green-600' : ''}`}
        >
          <StatisticIcon />
          <span className="ml-3">Statistic</span>
        </Link>
        
        <Link 
          to="/users" 
          className={`flex items-center p-4 hover:bg-green-600 ${location.pathname === '/users' ? 'bg-green-600' : ''}`}
        >
          <UserIcon />
          <span className="ml-3">Manage User</span>
        </Link>
        
        <Link 
          to="/settings" 
          className={`flex items-center p-4 hover:bg-green-600 ${location.pathname === '/settings' ? 'bg-green-600' : ''}`}
        >
          <SettingIcon />
          <span className="ml-3">Setting</span>
        </Link>
        
        <button 
          onClick={handleLogout}
          className="flex items-center p-4 hover:bg-green-600 text-left"
        >
          <LogoutIcon />
          <span className="ml-3">Log Out</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar; 