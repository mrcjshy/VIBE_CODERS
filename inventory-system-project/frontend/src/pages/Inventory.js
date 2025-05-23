import React from 'react';
import Sidebar from '../components/Sidebar';
import InventoryTable from '../components/InventoryTable';

const Inventory = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <InventoryTable />
    </div>
  );
};

export default Inventory; 