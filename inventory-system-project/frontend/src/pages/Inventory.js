import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { inventoryService, transactionService, settingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Category definitions with desired order
const CATEGORIES = {
  TEAS_AND_COFFEE: 'TEAS & COFFEE',
  SYRUPS: 'SYRUPS',
  PUREES: 'PUREES',
  DAIRY_AND_POWDER: 'DAIRY & POWDER',
  OTHER_EQUIPMENTS: 'OTHER EQUIPMENTS',
  GH_SAUCES: 'GH SAUCES',
  GH_POWDERS: 'GH POWDERS',
  OTHERS: 'OTHERS',
  CUPS_STRAWS_TISSUE: 'CUPS/STRAWS/TISSUE ETC.',
  TWINNINGS: 'TWINNINGS'
};

// Define the desired category order
const CATEGORY_ORDER = [
  'TEAS & COFFEE',
  'SYRUPS', 
  'PUREES',
  'DAIRY & POWDER',
  'OTHER EQUIPMENTS',
  'GH SAUCES',
  'GH POWDERS',
  'OTHERS',
  'CUPS/STRAWS/TISSUE ETC.',
  'TWINNINGS'
];

const Inventory = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [inventoryData, setInventoryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('All Categories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Add Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    unit: '',
    category: '',
    beginning: ''
  });

  useEffect(() => {
    fetchInventoryData();
    fetchSettings();
  }, [selectedDate]);

  const fetchSettings = async () => {
    try {
      const response = await settingsService.getAllSettings();
      setLowStockThreshold(response.data.lowStockThreshold || 10);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventoryByDate(selectedDate);
      setInventoryData(response.data.inventory || []);
      setError(null);
    } catch (error) {
      setError('Failed to load inventory data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate === today;
  };

  const validateInput = (value, field) => {
    if (value === '' || value === null) return field === 'beginning' ? 0 : '';
    const num = parseInt(value);
    if (isNaN(num) || num < 0) return field === 'beginning' ? 0 : '';
    return num;
  };

  const calculateTotalInventory = (item) => {
    const beginning = parseInt(item.beginning) || 0;
    const inValue = parseInt(item.in) || 0;
    return beginning + inValue;
  };

  const calculateRemaining = (item) => {
    const total = calculateTotalInventory(item);
    const out = parseInt(item.out) || 0;
    const spoilage = parseInt(item.spoilage) || 0;
    return Math.max(0, total - out - spoilage);
  };

  const handleInputChange = (itemId, field, value) => {
    // Allow editing for any date, not just today
    const validatedValue = validateInput(value, field);
    
    // Update local state immediately for responsiveness
    setInventoryData(prevData => 
      prevData.map(item => {
        if (item.id === itemId) {
          const updatedItem = { 
            ...item, 
            [field]: validatedValue 
          };
          
          // Recalculate derived values
          updatedItem.totalInventory = calculateTotalInventory(updatedItem);
          updatedItem.remaining = calculateRemaining(updatedItem);
          
          return updatedItem;
        }
        return item;
      })
    );

    // Track pending changes
    setPendingChanges(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        itemId,
        [field]: validatedValue
      }
    }));
  };

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    setSaving(true);
    try {
      // Create transactions for each pending change
      for (const [itemId, changes] of Object.entries(pendingChanges)) {
        const item = inventoryData.find(i => i.id === parseInt(itemId));
        if (!item) continue;

        // Create transactions for beginning changes (use 'beginning' type)
        if (changes.beginning !== undefined) {
          await transactionService.createInventoryTransaction({
            inventoryItemId: parseInt(itemId),
            type: 'beginning',
            quantity: changes.beginning,
            date: selectedDate,
            notes: `Beginning balance set for ${selectedDate}`
          });
        }

        // Create transactions for in, out, spoilage changes
        if (changes.in && changes.in > 0) {
          await transactionService.createInventoryTransaction({
            inventoryItemId: parseInt(itemId),
            type: 'in',
            quantity: changes.in,
            date: selectedDate,
            notes: `Stock in for ${selectedDate}`
          });
        }

        if (changes.out && changes.out > 0) {
          await transactionService.createInventoryTransaction({
            inventoryItemId: parseInt(itemId),
            type: 'out',
            quantity: changes.out,
            date: selectedDate,
            notes: `Stock out for ${selectedDate}`
          });
        }

        if (changes.spoilage && changes.spoilage > 0) {
          await transactionService.createInventoryTransaction({
            inventoryItemId: parseInt(itemId),
            type: 'spoilage',
            quantity: changes.spoilage,
            date: selectedDate,
            notes: `Spoilage for ${selectedDate}`
          });
        }
      }

      // Clear pending changes and refresh data
      setPendingChanges({});
      await fetchInventoryData();
      
      // If we edited a historical date, also refresh today's data to update beginning values
      const today = new Date().toISOString().split('T')[0];
      if (selectedDate !== today) {
        // Fetch today's data to see updated beginning values
        const todayResponse = await inventoryService.getInventoryByDate(today);
        console.log('Today\'s data updated after historical change:', todayResponse.data);
      }
      
      setError(null);
    } catch (error) {
      setError('Failed to save changes: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    try {
      await inventoryService.createItem(newItem);
      setShowAddModal(false);
      setNewItem({
        name: '',
        unit: '',
        category: '',
        beginning: ''
      });
      fetchInventoryData();
    } catch (error) {
      setError(`Failed to add item: ${error.message}`);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItemToDelete) {
      setError('Please select an item to delete');
      return;
    }
    
    const itemToDelete = inventoryData.find(item => item.id === parseInt(selectedItemToDelete));
    if (!itemToDelete) {
      setError('Selected item not found');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`)) {
      try {
        await inventoryService.deleteItem(selectedItemToDelete);
        setError(null);
        setShowRemoveModal(false);
        setSelectedItemToDelete('');
        fetchInventoryData();
      } catch (error) {
        setError(`Failed to delete item: ${error.message}`);
      }
    }
  };

  const isLowStock = (remaining) => {
    return remaining <= lowStockThreshold;
  };

  const groupItems = (items) => {
    const filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'All Categories' || item.category === filterBy;
      return matchesSearch && matchesFilter;
    });

    const grouped = filtered.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    // Return categories in the specified order
    return CATEGORY_ORDER.map(category => ({
      category,
      items: grouped[category] || []
    })).filter(group => group.items.length > 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-48 flex justify-center items-center w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
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
            Products
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and manage inventory for any date
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

        {/* Date Picker and Controls */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-auto"
                />
              </div>
              
              {isToday() && (
                <div className="flex items-center px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-800 font-medium">Today - Editable</span>
                </div>
              )}
              
              {!isToday() && (
                <div className="flex items-center px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                  <svg className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm text-orange-800 font-medium">Historical Data - Editable</span>
                </div>
              )}
            </div>

            {/* Save Changes Button - Show for any date with pending changes */}
            {Object.keys(pendingChanges).length > 0 && (
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 sm:px-6 py-2 sm:py-3 text-white rounded-md transition-colors font-medium w-full sm:w-auto"
                style={{ backgroundColor: saving ? '#9CA3AF' : '#68448C' }}
                onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#5a3a7a')}
                onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#68448C')}
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  `Save Changes (${Object.keys(pendingChanges).length})`
                )}
              </button>
            )}
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-64">
            <input 
              type="search" 
              className="w-full p-2 pl-8 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-2 top-2.5">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <select
              className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <option value="All Categories">All Categories</option>
              {CATEGORY_ORDER.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {user?.role === 'teamlead' && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center justify-center transition-colors hover:bg-green-700"
                >
                  <span className="hidden sm:inline">Add Item</span>
                  <span className="sm:hidden">Add</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => setShowRemoveModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center justify-center transition-colors hover:bg-red-700"
                >
                  <span className="hidden sm:inline">Remove Item</span>
                  <span className="sm:hidden">Remove</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Staff Access Notice */}
        {user?.role === 'barista' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                <strong>Barista Access:</strong> You can view and update inventory quantities, but cannot add or remove items. Contact a Team Lead for item management.
              </p>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="space-y-6">
          {groupItems(inventoryData).map(({ category, items }) => (
            items.length > 0 && (
              <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="text-white px-6 py-4" style={{ backgroundColor: '#68448C' }}>
                  <h3 className="text-lg font-semibold">{category}</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beginning</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Inventory</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spoilage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className={`hover:bg-gray-50 ${pendingChanges[item.id] ? 'bg-yellow-50' : ''}`}>
                          <td className="px-6 py-2 font-medium">{item.name}</td>
                          <td className="px-6 py-2">{item.unit}</td>
                          <td className="px-6 py-2">
                            <input
                              type="number"
                              min="0"
                              className="w-16 sm:w-20 p-1 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                              value={item.beginning || ''}
                              onChange={(e) => handleInputChange(item.id, 'beginning', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-2">
                            <input
                              type="number"
                              min="0"
                              className="w-16 sm:w-20 p-1 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                              value={item.in || ''}
                              onChange={(e) => handleInputChange(item.id, 'in', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-2 font-medium">{item.totalInventory || 0}</td>
                          <td className="px-6 py-2">
                            <input
                              type="number"
                              min="0"
                              className="w-16 sm:w-20 p-1 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                              value={item.out || ''}
                              onChange={(e) => handleInputChange(item.id, 'out', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-2">
                            <input
                              type="number"
                              min="0"
                              className="w-16 sm:w-20 p-1 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                              value={item.spoilage || ''}
                              onChange={(e) => handleInputChange(item.id, 'spoilage', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-2">
                            <span className={`font-medium ${isLowStock(item.remaining) ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.remaining || 0}
                              {isLowStock(item.remaining) && (
                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  LOW STOCK
                                </span>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Add Item Modal */}
        {user?.role === 'teamlead' && showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#68448C' }}>Add New Item</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  >
                    <option value="">Select a category</option>
                    {CATEGORY_ORDER.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Beginning</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    value={newItem.beginning}
                    onChange={(e) => setNewItem({...newItem, beginning: e.target.value === '' ? '' : (parseInt(e.target.value) || 0)})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 text-white rounded-md transition-colors"
                  style={{ backgroundColor: '#68448C' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a3a7a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#68448C'}
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Item Modal */}
        {user?.role === 'teamlead' && showRemoveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4 text-red-600">Remove Item</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Item to Delete</label>
                  <select
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    value={selectedItemToDelete}
                    onChange={(e) => setSelectedItemToDelete(e.target.value)}
                  >
                    <option value="">Choose an item to delete...</option>
                    {inventoryData
                      .sort((a, b) => {
                        // Sort by category order first, then by name
                        const aCategoryIndex = CATEGORY_ORDER.indexOf(a.category);
                        const bCategoryIndex = CATEGORY_ORDER.indexOf(b.category);
                        if (aCategoryIndex !== bCategoryIndex) {
                          return aCategoryIndex - bCategoryIndex;
                        }
                        return a.name.localeCompare(b.name);
                      })
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {item.category} - {item.name} ({item.unit})
                        </option>
                      ))}
                  </select>
                </div>
                {selectedItemToDelete && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      ⚠️ This will permanently delete the selected item and all its data. This action cannot be undone.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setSelectedItemToDelete('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteItem}
                  disabled={!selectedItemToDelete}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    selectedItemToDelete 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory; 