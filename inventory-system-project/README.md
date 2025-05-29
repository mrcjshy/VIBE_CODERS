# Inventory Management System

A comprehensive inventory management system built with **Node.js**, **Express**, **PostgreSQL**, and **React** - specifically designed for **bubble tea/beverage business operations**.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control (Team Lead/Barista)
- **Inventory Management**: Track products with beginning, in, out, spoilage, and remaining quantities
- **Daily Inventory Tracking**: Monitor daily inventory changes and movements with date-specific tracking
- **Transaction Logging**: Record all inventory movements with timestamps and user tracking
- **Dashboard & Analytics**: Visual charts and statistics for inventory insights using Recharts
- **Settings Management**: Configurable system settings (low stock thresholds, company info, notifications)
- **User Management**: Team Leads can manage user accounts and permissions
- **Category-based Organization**: Products organized by business-specific categories
- **Low Stock Monitoring**: Automated alerts for items below threshold levels
- **Historical Data**: Full transaction history with date-specific inventory snapshots

## Technology Stack

### Backend

- **Node.js** with **Express.js**
- **PostgreSQL** database
- **Sequelize** ORM for database operations
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** for cross-origin requests

### Frontend

- **React** (v18.2.0) with modern hooks
- **React Router DOM** (v6.8.0) for routing
- **Tailwind CSS** for styling and responsive design
- **Recharts** (v2.15.3) for data visualization and charts
- **Axios** (v1.9.0) for API communication

## Project Structure

```
inventory-system-project/
├── backend/
│   ├── config/
│   │   ├── db.js                      # Database connection config
│   │   └── config.json                # Sequelize database config
│   ├── controllers/
│   │   ├── authController.js          # Authentication logic
│   │   ├── inventoryController.js     # Inventory CRUD operations
│   │   ├── transactionController.js   # Transaction & dashboard stats
│   │   ├── userController.js          # User management
│   │   ├── settingsController.js      # System settings
│   │   ├── dailyInventoryController.js # Daily inventory snapshots
│   │   └── categoryController.js      # Category management
│   ├── middleware/
│   │   └── auth.js                    # JWT authentication middleware
│   ├── migrations/
│   │   ├── 20240305000000-create-inventory-items.js
│   │   ├── 20240305000001-modify-inventory-items.js
│   │   ├── 20240305000002-create-new-inventory-items.js
│   │   ├── 20240305000003-add-updatedby-to-daily-inventory.js
│   │   ├── 20240305000004-remove-suppliers.js
│   │   └── 20240305000005-add-transaction-date-index.js
│   ├── models/
│   │   ├── User.js                    # User model
│   │   ├── InventoryItem.js           # Inventory items model
│   │   ├── Transaction.js             # Transaction history model
│   │   ├── Settings.js                # System settings model
│   │   ├── DailyInventory.js          # Daily inventory snapshots
│   │   └── index.js                   # Sequelize model index
│   ├── routes/
│   │   ├── authRoutes.js              # Authentication endpoints
│   │   ├── inventoryRoutes.js         # Inventory CRUD endpoints
│   │   ├── transactionRoutes.js       # Transaction & dashboard endpoints
│   │   ├── userRoutes.js              # User management endpoints
│   │   ├── settingsRoutes.js          # Settings endpoints
│   │   ├── dailyInventoryRoutes.js    # Daily inventory endpoints
│   │   └── categoryRoutes.js          # Category endpoints
│   ├── scripts/
│   │   └── seed.js                    # Database seeding script
│   ├── seeders/
│   │   ├── seedDatabase.js            # Main seeder with default users
│   │   └── 20240305000000-demo-inventory-items.js # Full inventory catalog
│   ├── package.json
│   └── server.js                      # Express server entry point
├── frontend/
│   ├── public/
│   │   ├── baa_baa_login_logo.png     # Login page logo
│   │   ├── data_analytics_image.png   # Dashboard analytics image
│   │   ├── elephant baa baa logo.png  # Main application logo
│   │   ├── index.html                 # HTML template
│   │   ├── manifest.json              # PWA manifest
│   │   └── robots.txt                 # SEO robots file
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.js             # Navigation sidebar component
│   │   ├── pages/
│   │   │   ├── Login.js               # User login page
│   │   │   ├── Register.js            # User registration page
│   │   │   ├── Dashboard.js           # Main dashboard with stats & charts
│   │   │   ├── Inventory.js           # Inventory management page
│   │   │   ├── Statistics.js          # Analytics & reports page
│   │   │   ├── Settings.js            # System settings page
│   │   │   └── UserManagement.js      # User management (Team Lead only)
│   │   ├── services/
│   │   │   └── api.js                 # Axios API service configuration
│   │   ├── context/
│   │   │   └── AuthContext.js         # React context for authentication
│   │   ├── App.js                     # Main React app with routing
│   │   ├── index.js                   # React entry point
│   │   └── index.css                  # Tailwind CSS imports
│   ├── package.json
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   ├── postcss.config.js              # PostCSS configuration
│   └── .gitignore                     # Frontend gitignore
├── README.md                          # This file
├── TRANSACTION_DATE_FEATURE.md        # Transaction date feature documentation
└── .gitignore                         # Project gitignore
```

## Inventory Categories & Products

The system is specifically designed for **bubble tea/beverage business** with the following categories:

### **TEAS & COFFEE**

- Thai Tea Premium, Thai Green Tea, Full Tea, Half Tea, Thai Coffee

### **SYRUPS**

- Fructose Syrup, Lemon Syrup, Wintermelon Syrup, Passion Fruit Syrup
- Lychee Syrup, Green Apple Syrup, Strawberry Syrup, Strawberry Pulp
- Red Sala Syrup, and more specialty syrups

### **PUREES**

- Blueberry Puree, Banana Puree, Ube Puree

### **DAIRY & POWDER**

- Condensed Milk, Evaporated Milk, Creamer Powder, Whipping Cream
- Full Cream Milk, Cheesecake Powder, Salty Cheese Powder
- Dark Choco Powder, Taro Powder, Strawberry Powder
- **Sinkers**: Tapioca Big Pearl, Mini Pearl, Grass Jelly, Nata Original, Coffee Jelly, Fruit Jelly, Egg Pudding, Taro Balls

### **OTHER EQUIPMENTS**

- Permanent Marker, Masking Tape, Receipt Paper, Butane, Garbage Bag, Egg Pudding Container

### **GH SAUCES**

- Specialized sauces for beverage preparation

### **GH POWDERS**

- Specialized powder ingredients

### **OTHERS**

- Miscellaneous business items

### **CUPS/STRAWS/TISSUE ETC.**

- 16oz Cups, 22oz Cups, Cup Holders, Straws (various sizes)
- Sealing Films, Paper Bags, Plastic Bags, Tissues, Napkins

### **TWINNINGS**

- Earl Grey, English Breakfast, Green Tea, Camomile, Peppermint
- Prince of Wales, Lady Grey, Lemon & Ginger specialty teas

## Installation & Setup

### Prerequisites

- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd inventory-system-project/backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure database in `config/config.json`:**

   ```json
   {
     "development": {
       "username": "your_username",
       "password": "your_password",
       "database": "inventory_db",
       "host": "127.0.0.1",
       "dialect": "postgres"
     }
   }
   ```

4. **Create the database:**

   ```bash
   npx sequelize-cli db:create
   ```

5. **Run migrations:**

   ```bash
   npx sequelize-cli db:migrate
   ```

6. **Seed the database with inventory items:**

   ```bash
   npm run seed
   ```

7. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd inventory-system-project/frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

The application will be available at:

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

## Database Schema

### Core Tables

- **Users** - User accounts with role-based access (teamlead/barista)
- **InventoryItems** - Product catalog with categories, units, and quantities
- **Transactions** - All inventory movements with date tracking and user attribution
- **DailyInventories** - Daily inventory snapshots for historical tracking
- **Settings** - System configuration (low stock thresholds, company settings)

### Key Features

- **String-based Categories & Units**: Simple, flexible categorization system
- **No Complex Foreign Keys**: Simplified structure for easy maintenance
- **Date-specific Tracking**: Full support for historical transaction dates
- **Audit Logging**: Tracks who made changes and when
- **Automated Calculations**: Beginning values calculated from previous day's remaining

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Inventory Management

- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new item (Team Lead only)
- `PUT /api/inventory/:id` - Update item (Team Lead only)
- `DELETE /api/inventory/:id` - Delete item (Team Lead only)
- `GET /api/inventory/low-stock` - Get low stock items

### Transaction & Dashboard

- `GET /api/transactions/dashboard-stats` - Dashboard statistics with charts data
- `GET /api/transactions/inventory/:date` - Get inventory for specific date
- `PUT /api/transactions/inventory-date` - Update inventory for specific date
- `GET /api/transactions/top-products` - Get top products analysis

### Daily Inventory

- `GET /api/daily-inventory/generate` - Generate today's inventory
- `GET /api/daily-inventory/:date` - Get daily inventory for date
- `PUT /api/daily-inventory/:id` - Update daily inventory entry
- `PUT /api/daily-inventory` - Bulk update entries

### User Management (Team Lead only)

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Change user password
- `DELETE /api/users/:id` - Delete user

### Settings

- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting

### Categories

- `GET /api/categories` - Get all categories

## Default Users

After running `npm run seed`, these users are available:

- **Team Lead**:

  - Username: `teamlead`
  - Password: `teamlead123`
  - Email: `teamlead@inventory.com`

- **Barista**:
  - Username: `barista`
  - Password: `barista123`
  - Email: `barista@inventory.com`

## Application Features

### 🏠 Dashboard

- **Real-time Statistics**: Total items in stock, low stock alerts
- **Visual Charts**: Inventory trends using Recharts library
- **Today's Activity**: Recent transactions and received items
- **Quick Access**: Navigation to all major functions

### 📦 Inventory Management

- **Product Catalog**: Complete bubble tea inventory with 100+ items
- **Quantity Tracking**: Beginning, In, Out, Spoilage, Remaining
- **Category Organization**: Business-specific categories for easy navigation
- **Stock Monitoring**: Automated low stock detection and alerts
- **Date-specific Views**: Historical inventory snapshots

### 📊 Analytics & Statistics

- **Interactive Charts**: Visual representation of inventory data
- **Category Analysis**: Breakdown by product categories
- **Movement Tracking**: In/out trends over time
- **Low Stock Reports**: Items requiring attention

### ⚙️ Settings

- **Low Stock Threshold**: Configurable alert levels
- **Company Information**: Branding and business details
- **System Notifications**: Enable/disable alert systems

### 👥 User Management (Team Lead Only)

- **Account Creation**: Add new team members
- **Role Assignment**: Team Lead vs Barista permissions
- **Password Management**: Reset user passwords
- **Access Control**: Role-based feature restrictions

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: bcrypt hashing for all passwords
- **Role-based Access**: Different permissions for Team Lead vs Barista
- **Input Validation**: Server-side validation and sanitization
- **CORS Protection**: Configured cross-origin resource sharing
- **Audit Trails**: All changes tracked with user and timestamp

## Business Logic

### Inventory Calculations

- **Total Inventory** = Beginning + In
- **Remaining** = Total Inventory - Out - Spoilage
- **Beginning (Next Day)** = Previous Day's Remaining (auto-calculated)

### Low Stock Detection

- Items with remaining quantity ≤ configured threshold
- Out of stock items (remaining = 0)
- Percentage-based alerts for critical items

### Transaction Flow

- All inventory changes create transaction records
- Date-specific tracking allows historical analysis
- Beginning values automatically calculated from previous day
- No duplicate transactions - existing records updated when saving

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -am 'Add new feature'`)
6. Push to the branch (`git push origin feature/new-feature`)
7. Create a Pull Request

## Development Notes

- The project uses **Sequelize ORM** for database operations
- **Tailwind CSS** provides responsive, utility-first styling
- **React Context** manages authentication state
- **Recharts** library handles all data visualizations
- Database migrations ensure consistent schema across environments
- Full seeder data provides realistic bubble tea inventory for testing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Created by**: DARRYL YAM C. CANDILADA - BSIT-2-I  
**Project Type**: Bubble Tea Inventory Management System  
**Technologies**: Node.js, Express, PostgreSQL, React, Tailwind CSS
