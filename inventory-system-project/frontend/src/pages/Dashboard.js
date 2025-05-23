import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryService, categoryService } from '../services/api';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    categories: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all inventory items
        const inventoryResponse = await inventoryService.getAllItems();
        const items = inventoryResponse.data;
        
        // Fetch low stock items
        const lowStockResponse = await inventoryService.getLowStockItems();
        const lowStock = lowStockResponse.data;
        
        // Fetch categories
        const categoriesResponse = await categoryService.getAllCategories();
        const categories = categoriesResponse.data;
        
        // Set stats
        setStats({
          totalItems: items.length,
          lowStockItems: lowStock.length,
          categories: categories.length
        });
        
        // Set low stock items
        setLowStockItems(lowStock);
        
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-48 p-6 w-full">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Items Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700">Total Items</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalItems}</p>
          </div>
          
          {/* Low Stock Items Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700">Low Stock Items</h2>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockItems}</p>
          </div>
          
          {/* Categories Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700">Categories</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.categories}</p>
          </div>
        </div>
        
        {/* Low Stock Items Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Low Stock Items</h2>
          
          {lowStockItems.length === 0 ? (
            <p className="text-gray-500">No low stock items found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Min Stock Level
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-4 border-b border-gray-200">{item.name}</td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">{item.minStockLevel}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{item.Category?.name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 