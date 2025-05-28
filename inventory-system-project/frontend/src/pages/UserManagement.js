import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete', 'changePassword'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    role: 'barista'
  });

  // User stats
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    staffCount: 0,
    recentUsers: 0
  });

  // Helper function to display role names
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'teamlead':
        return 'Team Lead';
      case 'barista':
        return 'Barista';
      default:
        return role;
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter
      };

      const response = await userService.getAllUsers(params);
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await userService.getUserStats();
      setUserStats(response.data);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    
    if (type === 'add') {
      setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '', role: 'barista' });
    } else if (type === 'edit' && user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        newPassword: '',
        confirmPassword: '',
        role: user.role
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '', role: 'barista' });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'add') {
        await userService.createUser(formData);
        setSuccessMessage('User created successfully!');
      } else if (modalType === 'edit') {
        // Handle regular user data update
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't send empty password
        }
        // Remove password change fields from regular update
        delete updateData.newPassword;
        delete updateData.confirmPassword;
        
        await userService.updateUser(selectedUser.id, updateData);
        
        // Handle password change if new password is provided
        if (formData.newPassword && formData.newPassword.trim()) {
          // Validate passwords match
          if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
          }
          
          // Validate password length
          if (formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
          }
          
          // Change password
          await userService.changeUserPassword(selectedUser.id, {
            newPassword: formData.newPassword
          });
          
          setSuccessMessage(`User "${selectedUser.username}" updated successfully and password changed!`);
        } else {
          setSuccessMessage(`User "${selectedUser.username}" updated successfully!`);
        }
      }
      
      closeModal();
      fetchUsers();
      fetchUserStats();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save user');
    }
  };

  const handleDelete = async () => {
    try {
      await userService.deleteUser(selectedUser.id);
      setSuccessMessage('User deleted successfully!');
      closeModal();
      fetchUsers();
      fetchUserStats();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // Check if user is admin
  if (user?.role !== 'teamlead') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-48 p-6 w-full">
          <div className="text-center py-12">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">Only Team Leads can access user management.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-48 p-4 sm:p-6 w-full">
        <div className="mb-6 sm:mb-8 pt-16 lg:pt-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#68448C' }}>
            User Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage system users and their permissions
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 border border-green-400 rounded">
            {successMessage}
          </div>
        )}

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#68448C' }}>
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <p className="text-3xl font-bold mt-2" style={{ color: '#68448C' }}>
              {userStats.totalUsers}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700">Team Leads</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {userStats.adminCount}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700">Baristas</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {userStats.staffCount}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-700">New Users (30d)</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {userStats.recentUsers}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ focusRingColor: '#68448C' }}
                />
              </div>
              
              <div>
                <select
                  value={roleFilter}
                  onChange={handleRoleFilter}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ focusRingColor: '#68448C' }}
                >
                  <option value="">All Roles</option>
                  <option value="teamlead">Team Lead</option>
                  <option value="barista">Barista</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => openModal('add')}
              className="px-6 py-2 text-white rounded-md transition-colors"
              style={{ backgroundColor: '#68448C' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a3a7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#68448C'}
            >
              Add New User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#68448C' }}>
            <h2 className="text-xl font-semibold text-white">Users</h2>
            <p className="text-purple-100 text-sm">Manage user accounts and permissions</p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No users found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Username
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Email
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Role
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Created
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((userItem) => (
                        <tr key={userItem.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {userItem.username}
                            {userItem.id === user.id && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                You
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {userItem.email}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userItem.role === 'teamlead' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getRoleDisplayName(userItem.role)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openModal('edit', userItem)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                Edit
                              </button>
                              {userItem.id !== user.id && (
                                <button
                                  onClick={() => openModal('delete', userItem)}
                                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        style={{ borderColor: '#68448C' }}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        style={{ borderColor: '#68448C' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#68448C' }}>
                {modalType === 'add' && 'Add New User'}
                {modalType === 'edit' && 'Edit User'}
                {modalType === 'delete' && 'Delete User'}
              </h3>

              {modalType === 'delete' ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete user "{selectedUser?.username}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => handleFormChange('username', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ focusRingColor: '#68448C' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ focusRingColor: '#68448C' }}
                      />
                    </div>

                    {modalType === 'add' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => handleFormChange('password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                          style={{ focusRingColor: '#68448C' }}
                          placeholder="Enter password (minimum 6 characters)"
                        />
                      </div>
                    )}

                    {modalType === 'edit' && (
                      <>
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z" />
                            </svg>
                            Change Password (Optional)
                          </h4>
                          <p className="text-xs text-gray-500 mb-3">
                            Leave empty to keep current password. Fill both fields to change password.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            minLength={6}
                            value={formData.newPassword}
                            onChange={(e) => handleFormChange('newPassword', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                            style={{ focusRingColor: '#68448C' }}
                            placeholder="Enter new password (minimum 6 characters)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            minLength={6}
                            value={formData.confirmPassword}
                            onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                            style={{ focusRingColor: '#68448C' }}
                            placeholder="Confirm new password"
                          />
                        </div>

                        {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                          <div className="text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Passwords do not match
                          </div>
                        )}

                        {formData.newPassword && formData.newPassword.length > 0 && formData.newPassword.length < 6 && (
                          <div className="text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Password must be at least 6 characters long
                          </div>
                        )}

                        {formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && formData.newPassword.length >= 6 && (
                          <div className="text-sm text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Password will be changed
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleFormChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ focusRingColor: '#68448C' }}
                      >
                        <option value="barista">Barista</option>
                        <option value="teamlead">Team Lead</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white rounded transition-colors"
                      style={{ backgroundColor: '#68448C' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#5a3a7a'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#68448C'}
                    >
                      {modalType === 'add' ? 'Create User' : 'Update User'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement; 