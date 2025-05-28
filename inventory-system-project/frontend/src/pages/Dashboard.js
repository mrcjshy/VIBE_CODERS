import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionService, inventoryService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalItemsInStock: 0,
    lowStockCount: 0,
    lowStockItems: [],
    todayStats: {
      in: 0,
      out: 0,
      spoilage: 0
    },
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [allInventoryItems, setAllInventoryItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchAllInventoryItems();
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchAllInventoryItems();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
      // Fetch dashboard stats and top outgoing products in parallel
      const [dashboardResponse, topProductsResponse] = await Promise.all([
        transactionService.getDashboardStats(),
        transactionService.getTopOutgoingProducts({ limit: 5, days: 30 })
      ]);
      
      // Combine the data
      setDashboardData({
        ...dashboardResponse.data,
        topProducts: topProductsResponse.data.products || []
      });
      
      setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  const fetchAllInventoryItems = async () => {
    try {
      const response = await inventoryService.getAllItems();
      setAllInventoryItems(response.data || []);
    } catch (err) {
      console.error('Failed to fetch inventory items:', err);
    }
  };

  const handleViewLowStock = async () => {
    setModalLoading(true);
    setModalType('lowStock');
    setShowModal(true);
    try {
      const response = await inventoryService.getLowStockItems();
      setModalData(response.data || []);
    } catch (err) {
      console.error('Failed to fetch low stock items:', err);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewTotalItems = () => {
    setModalType('totalItems');
    setModalData(allInventoryItems);
    setShowModal(true);
  };

  const handleViewTodayReceived = async () => {
    setModalLoading(true);
    setModalType('todayReceived');
    setShowModal(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await transactionService.getAllTransactions({
        startDate: today,
        endDate: today,
        type: 'in',
        limit: 100
      });
      setModalData(response.data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch today\'s received items:', err);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewTodayOutgoing = async () => {
    setModalLoading(true);
    setModalType('todayOutgoing');
    setShowModal(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await transactionService.getAllTransactions({
        startDate: today,
        endDate: today,
        type: 'out',
        limit: 100
      });
      setModalData(response.data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch today\'s outgoing items:', err);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewTodaySpoilage = async () => {
    setModalLoading(true);
    setModalType('todaySpoilage');
    setShowModal(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await transactionService.getAllTransactions({
        startDate: today,
        endDate: today,
        type: 'spoilage',
        limit: 100
      });
      setModalData(response.data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch today\'s spoilage items:', err);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setModalData([]);
  };

  const renderModalContent = () => {
    if (modalLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: '#68448C' }}></div>
        </div>
      );
    }

    const getModalTitle = () => {
      switch (modalType) {
        case 'totalItems': return 'All Inventory Items';
        case 'lowStock': return 'Low Stock Items';
        case 'todayReceived': return 'Today\'s Received Items';
        case 'todayOutgoing': return 'Today\'s Outgoing Items';
        case 'todaySpoilage': return 'Today\'s Spoilage Items';
        default: return 'Items';
      }
    };

    if (modalData.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No items found</p>
          <p className="text-gray-400 text-sm">There are no items to display for this category</p>
        </div>
      );
    }

    if (modalType === 'totalItems' || modalType === 'lowStock') {
      return (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Name</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Category</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Unit</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Current Stock</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Total Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {modalData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                  <td className="py-3 px-4 text-gray-600">{item.category}</td>
                  <td className="py-3 px-4 text-gray-600">{item.unit}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      modalType === 'lowStock' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.remaining}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{item.totalInventory}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // For transaction-based modals (received, outgoing, spoilage)
    return (
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="min-w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Item Name</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Category</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Quantity</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Time</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {modalData.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="py-3 px-4 font-medium text-gray-900">{transaction.InventoryItem?.name || 'N/A'}</td>
                <td className="py-3 px-4 text-gray-600">{transaction.InventoryItem?.category || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    modalType === 'todayReceived' ? 'bg-green-100 text-green-800' :
                    modalType === 'todayOutgoing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.quantity} {transaction.InventoryItem?.unit || ''}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(transaction.date).toLocaleTimeString()}
                </td>
                <td className="py-3 px-4 text-gray-600">{transaction.User?.username || 'System'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleGoToStatistics = () => {
    navigate('/statistics');
  };

  const handleGoToInventory = () => {
    navigate('/inventory');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded">
        {error}
        <button 
          onClick={fetchDashboardData}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-48 p-4 sm:p-6 w-full">
        <div className="mb-6 sm:mb-8 pt-16 lg:pt-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#68448C' }}>
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome back, {user?.username}! Here's your inventory overview.
          </p>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Items in Stock */}
          <div 
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 hover:shadow-xl transition-shadow duration-200 cursor-pointer" 
            style={{ borderLeftColor: '#68448C' }}
            onClick={handleViewTotalItems}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Total Items in Stock</h2>
                <p className="text-3xl font-bold mt-2" style={{ color: '#68448C' }}>
                  {(dashboardData.totalItemsInStock || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Click to view all items</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: '#68448C', opacity: 0.1 }}>
                <svg className="w-8 h-8" style={{ color: '#68448C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Low Stock Items */}
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-200 cursor-pointer" onClick={handleViewLowStock}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Low Stock Alerts</h2>
                <p className="text-3xl font-bold text-red-600 mt-2">{dashboardData.lowStockCount || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Items need restocking</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Today's In */}
          <div 
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200 cursor-pointer"
            onClick={handleViewTodayReceived}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Today's Received</h2>
                <p className="text-3xl font-bold text-green-600 mt-2">{dashboardData.todayStats?.in || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Items added to stock</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Today's Out */}
          <div 
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-200 cursor-pointer"
            onClick={handleViewTodayOutgoing}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Today's Outgoing</h2>
                <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.todayStats?.out || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Items removed from stock</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="mb-8">
          {/* Today's Spoilage */}
          <div 
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-200 cursor-pointer"
            onClick={handleViewTodaySpoilage}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Today's Spoilage</h2>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{dashboardData.todayStats?.spoilage || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Items lost to spoilage</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top In-Demand Products */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#68448C' }}>
            <h2 className="text-xl font-semibold text-white">Top In-Demand Products</h2>
            <p className="text-purple-100 text-sm">Products with highest outgoing quantities (Last 30 days)</p>
          </div>
          
          <div className="p-6">
            {(dashboardData.topProducts || []).length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No product data available</p>
                <p className="text-gray-400 text-sm">Add some inventory movements to see top products</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Rank
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Product Name
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Category
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Total Out
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Transactions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(dashboardData.topProducts || []).map((product, index) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-3 px-4">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                                style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#68448C' }}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                        <td className="py-3 px-4 text-gray-600">{product.category}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.totalOut} {product.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                            {product.transactionCount} times
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        {(dashboardData.lowStockItems || []).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#68448C' }}>
              <h2 className="text-xl font-semibold text-white">Low Stock Items</h2>
              <p className="text-purple-100 text-sm">Items that need immediate attention</p>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Name
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Category
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Current Stock
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                        Total Inventory
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(dashboardData.lowStockItems || []).slice(0, 10).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                        <td className="py-3 px-4 text-gray-600">{item.category}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {item.remaining}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{item.totalInventory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(dashboardData.lowStockItems || []).length > 10 && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={handleViewLowStock}
                    className="px-4 py-2 text-white rounded-md transition-colors"
                    style={{ backgroundColor: '#68448C' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5a3a7a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#68448C'}
                  >
                    View All {(dashboardData.lowStockItems || []).length} Low Stock Items
                  </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={closeModal}
              ></div>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          {(() => {
                            switch (modalType) {
                              case 'totalItems': return 'All Inventory Items';
                              case 'lowStock': return 'Low Stock Items';
                              case 'todayReceived': return 'Today\'s Received Items';
                              case 'todayOutgoing': return 'Today\'s Outgoing Items';
                              case 'todaySpoilage': return 'Today\'s Spoilage Items';
                              default: return 'Items';
                            }
                          })()}
                        </h3>
                        <button
                          onClick={closeModal}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {renderModalContent()}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-opacity"
                    style={{ backgroundColor: '#68448C' }}
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 