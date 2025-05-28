import React, { useState } from 'react';
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

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    // Navigate to login page is handled by protected routes
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-white"
        style={{ backgroundColor: '#68448C' }}
      >
        {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        text-white h-screen w-48 fixed left-0 top-0 flex flex-col z-40 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ backgroundColor: '#68448C' }}>
        <div className="p-4 flex justify-center">
          <div className="rounded-full bg-white p-2 w-24 h-24 flex items-center justify-center shadow-lg">
            <img 
              src="/elephant baa baa logo.png" 
              alt="Baa Baa Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
        
        <nav className="flex flex-col mt-6">
          <Link 
            to="/dashboard" 
            onClick={closeMobileMenu}
            className={`flex items-center p-4 transition-colors duration-200 ${
              location.pathname === '/dashboard' 
                ? 'bg-white bg-opacity-20 border-r-4 border-white' 
                : 'hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <HomeIcon />
            <span className="ml-3">Home</span>
            {location.pathname === '/dashboard' && (
              <span className="ml-2 h-2 w-2 bg-white rounded-full"></span>
            )}
          </Link>
          
          <Link 
            to="/inventory" 
            onClick={closeMobileMenu}
            className={`flex items-center p-4 transition-colors duration-200 ${
              location.pathname === '/inventory' 
                ? 'bg-white bg-opacity-20 border-r-4 border-white' 
                : 'hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <ProductIcon />
            <span className="ml-3">Product</span>
            {location.pathname === '/inventory' && (
              <span className="ml-2 h-2 w-2 bg-white rounded-full"></span>
            )}
          </Link>
          
          <Link 
            to="/statistics" 
            onClick={closeMobileMenu}
            className={`flex items-center p-4 transition-colors duration-200 ${
              location.pathname === '/statistics' 
                ? 'bg-white bg-opacity-20 border-r-4 border-white' 
                : 'hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <StatisticIcon />
            <span className="ml-3">Statistic</span>
            {location.pathname === '/statistics' && (
              <span className="ml-2 h-2 w-2 bg-white rounded-full"></span>
            )}
          </Link>
          
          <Link 
            to="/users" 
            onClick={closeMobileMenu}
            className={`flex items-center p-4 transition-colors duration-200 ${
              location.pathname === '/users' 
                ? 'bg-white bg-opacity-20 border-r-4 border-white' 
                : 'hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <UserIcon />
            <span className="ml-3">Manage User</span>
            {location.pathname === '/users' && (
              <span className="ml-2 h-2 w-2 bg-white rounded-full"></span>
            )}
          </Link>
          
          <Link 
            to="/settings" 
            onClick={closeMobileMenu}
            className={`flex items-center p-4 transition-colors duration-200 ${
              location.pathname === '/settings' 
                ? 'bg-white bg-opacity-20 border-r-4 border-white' 
                : 'hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <SettingIcon />
            <span className="ml-3">Setting</span>
            {location.pathname === '/settings' && (
              <span className="ml-2 h-2 w-2 bg-white rounded-full"></span>
            )}
          </Link>
          
          <button 
            onClick={handleLogoutClick}
            className="flex items-center p-4 hover:bg-white hover:bg-opacity-10 text-left transition-colors duration-200 mt-auto mb-4"
          >
            <LogoutIcon />
            <span className="ml-3">Log Out</span>
          </button>
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirm Logout</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to log out? You will need to sign in again to access your account.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
                style={{ backgroundColor: '#68448C' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a3a7a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#68448C'}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar; 