import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { transactionService } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const Statistics = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [filters, setFilters] = useState({
    productName: '',
    category: '',
    type: ''
  });

  const [statistics, setStatistics] = useState({
    chartData: {
      dailyMovements: [],
      categoryDistribution: [],
      stockLevels: []
    },
    transactions: [],
    metrics: {
      totalIn: 0,
      totalOut: 0,
      totalSpoilage: 0,
      turnoverRate: 0,
      avgDailyOutflow: 0,
      projectedDepletion: null
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const COLORS = ['#68448C', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  useEffect(() => {
    fetchStatistics();
  }, [dateRange, currentPage]);

  useEffect(() => {
    // Apply filters when they change
    if (filters.productName || filters.category || filters.type) {
      const timeoutId = setTimeout(() => {
        fetchStatistics();
      }, 500); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      fetchStatistics();
    }
  }, [filters]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: currentPage,
        limit: 50,
        ...filters
      };

      console.log('Fetching statistics with params:', params);
      const response = await transactionService.getStatistics(params);
      console.log('Statistics response:', response.data);
      
      setStatistics(response.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      productName: '',
      category: '',
      type: ''
    });
    setCurrentPage(1);
  };

  const getQuickDateRange = (days) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateRange({ startDate, endDate });
    setCurrentPage(1);
  };

  if (loading && statistics.chartData.dailyMovements.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-48 p-4 sm:p-6 w-full">
        <div className="mb-6 sm:mb-8 pt-16 lg:pt-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#68448C' }}>
            Statistics & Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View detailed analytics and trends for your inventory
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
            {error}
            <button 
              onClick={fetchStatistics}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Date Range and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#68448C' }}>
            Filters & Date Range
          </h2>
          
          {/* Quick Date Range Buttons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Date Ranges
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Last 7 days', days: 7 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 60 days', days: 60 },
                { label: 'Last 90 days', days: 90 }
              ].map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => getQuickDateRange(days)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#68448C', color: '#68448C' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#68448C' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#68448C' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.productName}
                onChange={(e) => handleFilterChange('productName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#68448C' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#68448C' }}
              >
                <option value="">All Types</option>
                <option value="in">In</option>
                <option value="out">Out</option>
                <option value="spoilage">Spoilage</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700">Total In</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {(statistics.metrics?.totalIn || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">Items received</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700">Total Out</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {(statistics.metrics?.totalOut || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">Items dispensed</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-700">Total Spoilage</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {(statistics.metrics?.totalSpoilage || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">Items lost</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#68448C' }}>
            <h3 className="text-lg font-semibold text-gray-700">Avg Daily Outflow</h3>
            <p className="text-3xl font-bold mt-2" style={{ color: '#68448C' }}>
              {(statistics.metrics?.avgDailyOutflow || 0).toFixed(1)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Items per day</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Movements Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#68448C' }}>
              Daily Inventory Movements
            </h2>
            {(statistics.chartData?.dailyMovements || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statistics.chartData.dailyMovements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2} name="In" />
                  <Line type="monotone" dataKey="out" stroke="#3B82F6" strokeWidth={2} name="Out" />
                  <Line type="monotone" dataKey="spoilage" stroke="#F59E0B" strokeWidth={2} name="Spoilage" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No movement data available for selected period
              </div>
            )}
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#68448C' }}>
              Inventory by Category
            </h2>
            {(statistics.chartData?.categoryDistribution || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.chartData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(statistics.chartData?.categoryDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Stock Levels Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#68448C' }}>
            Current Stock Levels by Product
          </h2>
          {(statistics.chartData?.stockLevels || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statistics.chartData.stockLevels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#68448C" name="Current Stock" />
                <Bar dataKey="minStock" fill="#EF4444" name="Min Stock Level" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No stock level data available
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#68448C' }}>
            <h2 className="text-xl font-semibold text-white">Transaction History</h2>
            <p className="text-purple-100 text-sm">Detailed view of all inventory movements</p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading transactions...</p>
              </div>
            ) : (statistics.transactions || []).length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No transactions found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Date
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Product
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Type
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Quantity
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          User
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ backgroundColor: '#f8f9fa' }}>
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(statistics.transactions || []).map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {transaction.InventoryItem?.name || 'Unknown'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.type === 'in' ? 'bg-green-100 text-green-800' :
                              transaction.type === 'out' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {transaction.quantity}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {transaction.User?.username || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {transaction.notes || '-'}
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
      </div>
    </div>
  );
};

export default Statistics; 