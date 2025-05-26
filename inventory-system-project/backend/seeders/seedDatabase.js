const { 
  User, 
  Category, 
  InventoryItem, 
  Unit, 
  Supplier, 
  Transaction 
} = require('../models');

const seedDatabase = async () => {
  try {
    // Create admin and staff users
    const adminUser = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@bubbletea.com',
        password: 'admin123',
        role: 'admin'
      }
    });

    const staffUser = await User.findOrCreate({
      where: { username: 'staff' },
      defaults: {
        username: 'staff',
        email: 'staff@bubbletea.com',
        password: 'staff123',
        role: 'staff'
      }
    }); 

    // Create units
    const units = [
      { name: 'pack', abbreviation: 'pack' },
      { name: 'bottle', abbreviation: 'bottle' },
      { name: 'canister', abbreviation: 'canister' },
      { name: 'can', abbreviation: 'can' },
      { name: 'liter', abbreviation: 'l' },
      { name: 'gallon', abbreviation: 'gallon' },
      { name: 'piece', abbreviation: 'pc' },
      { name: 'sachet', abbreviation: 'sachet' },
      { name: 'gram', abbreviation: 'g' },
      { name: 'roll', abbreviation: 'roll' },
      { name: 'bag', abbreviation: 'bag' },
      { name: 'stick', abbreviation: 'stick' }
    ];

    for (const unit of units) {
      await Unit.findOrCreate({
        where: { name: unit.name },
        defaults: unit
      });
    }

    // Create categories
    const categories = [
      { name: 'TEAS & COFFEE', description: 'Tea and coffee products' },
      { name: 'SYRUPS', description: 'Flavoring syrups' },
      { name: 'PUREES', description: 'Fruit purees' },
      { name: 'DAIRY & POWDER', description: 'Dairy products and powders' },
      { name: 'SINKERS', description: 'Bubble tea sinkers and toppings' },
      { name: 'OTHER EQUIPMENTS', description: 'Store equipment and supplies' },
      { name: 'GEL SAUCES', description: 'Gel and sauce toppings' },
      { name: 'OTHERS', description: 'Other miscellaneous items' },
      { name: 'CUPS/STRAW/TISSUE ETC', description: 'Cups, straws, and disposables' },
      { name: 'TWINNINGS', description: 'Twinnings tea products' }
    ];

    for (const category of categories) {
      await Category.findOrCreate({
        where: { name: category.name },
        defaults: category
      });
    }

    // Create a sample supplier
    await Supplier.findOrCreate({
      where: { name: 'Main Supplier' },
      defaults: {
        name: 'Main Supplier',
        contactPerson: 'John Doe',
        phone: '+1234567890',
        email: 'supplier@example.com',
        address: '123 Supplier Street'
      }
    });

    // Get created records for relationships
    const teaCategory = await Category.findOne({ where: { name: 'TEAS & COFFEE' } });
    const syrupCategory = await Category.findOne({ where: { name: 'SYRUPS' } });
    const pureeCategory = await Category.findOne({ where: { name: 'PUREES' } });
    const dairyCategory = await Category.findOne({ where: { name: 'DAIRY & POWDER' } });
    const cupsCategory = await Category.findOne({ where: { name: 'CUPS/STRAW/TISSUE ETC' } });

    const packUnit = await Unit.findOne({ where: { name: 'pack' } });
    const bottleUnit = await Unit.findOne({ where: { name: 'bottle' } });
    const canisterUnit = await Unit.findOne({ where: { name: 'canister' } });
    const canUnit = await Unit.findOne({ where: { name: 'can' } });
    const pieceUnit = await Unit.findOne({ where: { name: 'piece' } });

    const supplier = await Supplier.findOne({ where: { name: 'Main Supplier' } });

    // Create sample inventory items
    const sampleItems = [
      // Teas & Coffee
      { name: 'Thai Tea Premium', categoryId: teaCategory.id, unitId: packUnit.id },
      { name: 'Thai Green Tea', categoryId: teaCategory.id, unitId: packUnit.id },
      { name: 'Full Tea', categoryId: teaCategory.id, unitId: packUnit.id },
      { name: 'Half Tea', categoryId: teaCategory.id, unitId: packUnit.id },
      { name: 'Thai Coffee', categoryId: teaCategory.id, unitId: packUnit.id },

      // Syrups
      { name: 'Fructose Syrup', categoryId: syrupCategory.id, unitId: bottleUnit.id },
      { name: 'Lemon Syrup', categoryId: syrupCategory.id, unitId: bottleUnit.id },
      { name: 'Wintermelon Syrup', categoryId: syrupCategory.id, unitId: bottleUnit.id },
      { name: 'Passion Fruit Syrup', categoryId: syrupCategory.id, unitId: bottleUnit.id },
      { name: 'Lychee Syrup', categoryId: syrupCategory.id, unitId: bottleUnit.id },

      // Purees
      { name: 'Blueberry Puree', categoryId: pureeCategory.id, unitId: canisterUnit.id },
      { name: 'Banana Puree', categoryId: pureeCategory.id, unitId: canisterUnit.id },
      { name: 'Ube Puree', categoryId: pureeCategory.id, unitId: canisterUnit.id },

      // Dairy & Powder
      { name: 'Condensed Milk', categoryId: dairyCategory.id, unitId: canUnit.id },
      { name: 'Evaporated Milk', categoryId: dairyCategory.id, unitId: canUnit.id },
      { name: 'Creamer Powder Milk Mixture', categoryId: dairyCategory.id, unitId: packUnit.id },

      // Cups/Straws/Tissue
      { name: '500ml Frosted Cups', categoryId: cupsCategory.id, unitId: pieceUnit.id },
      { name: '700ml Frosted Cups', categoryId: cupsCategory.id, unitId: pieceUnit.id },
      { name: 'Boba Straw', categoryId: cupsCategory.id, unitId: pieceUnit.id }
    ];

    for (const item of sampleItems) {
      await InventoryItem.findOrCreate({
        where: { name: item.name },
        defaults: {
          ...item,
          supplierId: supplier.id,
          beginningQuantity: 0,
          currentQuantity: 0,
          totalInventory: 0,
          outQuantity: 0,
          spoilageQuantity: 0,
          minStockLevel: 5
        }
      });
    }

    console.log('Database seeded successfully!');
    console.log('Admin User: username: admin, password: admin123');
    console.log('Staff User: username: staff, password: staff123');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase; 