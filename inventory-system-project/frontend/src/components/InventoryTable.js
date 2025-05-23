import React, { useState } from 'react';

// Sample data
const initialInventoryData = [
  {
    id: 1,
    itemName: 'Arla Full Cream',
    unit: 'unit',
    beginning: 105,
    in: 105,
    totalInventory: 105,
    out: 9,
    spoilage: 0,
    remaining: 96
  },
  {
    id: 2,
    itemName: 'Arabica Bean',
    unit: 'unit',
    beginning: 20,
    in: 20,
    totalInventory: 20,
    out: 2,
    spoilage: 0,
    remaining: 18
  },
  {
    id: 3,
    itemName: 'DaVinci Vanilla',
    unit: 'unit',
    beginning: 10,
    in: 10,
    totalInventory: 10,
    out: 0,
    spoilage: 0,
    remaining: 10
  },
  {
    id: 4,
    itemName: '500ml Frosted Cups',
    unit: 'unit',
    beginning: 350,
    in: 350,
    totalInventory: 350,
    out: 40,
    spoilage: 2,
    remaining: 308
  }
];

const InventoryTable = () => {
  const [inventoryData, setInventoryData] = useState(initialInventoryData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('Item name');
  const [viewMode, setViewMode] = useState('table');
  const [editItem, setEditItem] = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = inventoryData.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item) => {
    setEditItem(item.id);
    setEditValues({ ...item });
  };

  const handleSave = () => {
    setInventoryData(prevData => 
      prevData.map(item => item.id === editItem ? { ...editValues } : item)
    );
    setEditItem(null);
  };

  const handleCancel = () => {
    setEditItem(null);
  };

  const handleInputChange = (e, field) => {
    setEditValues({
      ...editValues,
      [field]: field === 'itemName' ? e.target.value : Number(e.target.value)
    });
  };

  const handleAddItem = () => {
    const newItem = {
      id: inventoryData.length + 1,
      itemName: 'New Item',
      unit: 'unit',
      beginning: 0,
      in: 0,
      totalInventory: 0,
      out: 0,
      spoilage: 0,
      remaining: 0
    };
    
    setInventoryData([...inventoryData, newItem]);
    setEditItem(newItem.id);
    setEditValues(newItem);
  };

  return (
    <div className="ml-48 p-6">
      {/* Search and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="relative w-full md:w-96 mb-4 md:mb-0">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input 
            type="search" 
            className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex items-center">
          <div className="relative mr-3">
            <button className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center">
              <span>Filter: {filterBy}</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            {/* Dropdown would go here */}
          </div>
          
          <button 
            onClick={handleAddItem}
            className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Item
          </button>
          
          <div className="ml-3 flex border rounded">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-gray-200' : 'bg-white'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Item name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Beginning
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Total Inventory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Spoilage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editItem === item.id ? (
                      <input
                        type="text"
                        value={editValues.itemName}
                        onChange={(e) => handleInputChange(e, 'itemName')}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editItem === item.id ? (
                      <div className="flex items-center">
                        <span className="mr-1">⌀</span>
                        <input
                          type="number"
                          value={editValues.beginning}
                          onChange={(e) => handleInputChange(e, 'beginning')}
                          className="border rounded px-2 py-1 w-16"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">⌀ {item.beginning}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editItem === item.id ? (
                      <div className="flex items-center">
                        <span className="mr-1">⌀</span>
                        <input
                          type="number"
                          value={editValues.in}
                          onChange={(e) => handleInputChange(e, 'in')}
                          className="border rounded px-2 py-1 w-16"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">⌀ {item.in}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">⌀ {item.totalInventory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editItem === item.id ? (
                      <div className="flex items-center">
                        <span className="mr-1">⌀</span>
                        <input
                          type="number"
                          value={editValues.out}
                          onChange={(e) => handleInputChange(e, 'out')}
                          className="border rounded px-2 py-1 w-16"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">⌀ {item.out}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editItem === item.id ? (
                      <div className="flex items-center">
                        <span className="mr-1">⌀</span>
                        <input
                          type="number"
                          value={editValues.spoilage}
                          onChange={(e) => handleInputChange(e, 'spoilage')}
                          className="border rounded px-2 py-1 w-16"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">⌀ {item.spoilage}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">⌀ {item.remaining}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editItem === item.id ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleSave} 
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button 
                          onClick={handleCancel} 
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEdit(item)} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <div className="font-bold text-lg mb-2">{item.itemName}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-600">Beginning:</div>
                <div className="text-sm">⌀ {item.beginning}</div>
                
                <div className="text-sm text-gray-600">In:</div>
                <div className="text-sm">⌀ {item.in}</div>
                
                <div className="text-sm text-gray-600">Total:</div>
                <div className="text-sm">⌀ {item.totalInventory}</div>
                
                <div className="text-sm text-gray-600">Out:</div>
                <div className="text-sm">⌀ {item.out}</div>
                
                <div className="text-sm text-gray-600">Spoilage:</div>
                <div className="text-sm">⌀ {item.spoilage}</div>
                
                <div className="text-sm text-gray-600">Remaining:</div>
                <div className="text-sm">⌀ {item.remaining}</div>
              </div>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleEdit(item)} 
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryTable; 