const { InventoryItem, Category } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Get all inventory items
const getAllItems = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      include: [{ model: Category }]
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
  }
};

// Get a single inventory item by ID
const getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id, {
      include: [{ model: Category }]
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory item', error: error.message });
  }
};

// Create a new inventory item
const createItem = async (req, res) => {
  try {
    const { 
      name, description, quantity, price, categoryId, 
      sku, location, minStockLevel 
    } = req.body;

    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Create new item
    const newItem = await InventoryItem.create({
      name,
      description,
      quantity,
      price,
      categoryId,
      sku,
      location,
      minStockLevel,
      lastRestocked: new Date()
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      item: newItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
};

// Update an inventory item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, description, quantity, price, categoryId, 
      sku, location, minStockLevel 
    } = req.body;

    // Check if item exists
    const item = await InventoryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // If category is being updated, check if new category exists
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }

    // Update item
    await item.update({
      name,
      description,
      quantity,
      price,
      categoryId,
      sku,
      location,
      minStockLevel,
      lastRestocked: quantity !== item.quantity ? new Date() : item.lastRestocked
    });

    res.status(200).json({
      message: 'Inventory item updated successfully',
      item
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
};

// Delete an inventory item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const item = await InventoryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Delete item
    await item.destroy();

    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: {
        quantity: {
          [Op.lte]: sequelize.col('minStockLevel')
        }
      },
      include: [{ model: Category }]
    });

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems
}; 