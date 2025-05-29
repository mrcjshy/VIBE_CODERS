# Inventory Management System

A comprehensive inventory management system built with **Node.js**, **Express**, **PostgreSQL**, and **React**.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control (Team Lead/Barista)
- **Inventory Management**: Track products with beginning, in, out, spoilage, and remaining quantities
- **Daily Inventory Tracking**: Monitor daily inventory changes and movements
- **Transaction Logging**: Record all inventory movements with timestamps and user tracking
- **Dashboard & Analytics**: Visual charts and statistics for inventory insights
- **Settings Management**: Configurable system settings
- **User Management**: Team Leads can manage user accounts and permissions

## Technology Stack

### Backend

- **Node.js** with **Express.js**
- **PostgreSQL** database
- **Sequelize** ORM
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend

- **React** with hooks
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API communication

## Project Structure

```
inventory-system-project/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── config.json
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── inventoryController.js
│   │   ├── transactionController.js
│   │   ├── userController.js
│   │   ├── settingsController.js
│   │   ├── dailyInventoryController.js
│   │   └── categoryController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── migrations/
│   │   └── [database migration files]
│   ├── models/
│   │   ├── User.js
│   │   ├── InventoryItem.js
│   │   ├── Transaction.js
│   │   ├── Settings.js
│   │   ├── DailyInventory.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── userRoutes.js
│   │   ├── settingsRoutes.js
│   │   ├── dailyInventoryRoutes.js
│   │   └── categoryRoutes.js
│   ├── scripts/
│   │   └── seed.js
│   ├── seeders/
│   │   ├── seedDatabase.js
│   │   └── 20240305000000-demo-inventory-items.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── baa_baa_login_logo.png
│   │   ├── data_analytics_image.png
│   │   ├── elephant baa baa logo.png
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Inventory.js
│   │   │   ├── Statistics.js
│   │   │   ├── Settings.js
│   │   │   └── UserManagement.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .gitignore
├── README.md
├── TRANSACTION_DATE_FEATURE.md
└── .gitignore
```

## Categories & Inventory Items

The system includes comprehensive product categories:

- **FOOD**: Rice, Beans, Flour, Oil, Sugar, Salt, etc.
- **BEVERAGES**: Tea bags, Coffee beans, Milk powder, Juice, etc.
- **DAIRY & POWDER**: Milk powder, Ice cream powder, Cream cheese, etc.
- **SINKERS**: Tapioca Pearl, Grass Jelly, Nata Original, Coffee Jelly, Fruit Jelly, Egg pudding
- **SAUCE**: Ketchup, Soy sauce, Hot sauce, Vinegar, etc.
- **SNACKS**: Crackers, Cookies, Chips, etc.
- **SUPPLIES**: Paper cups, Plastic spoons, Napkins, etc.
- **MEAT**: Chicken, Beef, Pork, Fish, etc.
- **VEGETABLES**: Onions, Garlic, Tomatoes, etc.
- **FROZEN**: Frozen vegetables, Ice cream, etc.

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd inventory-system-project/backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure database in `config/config.json`:

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

4. Create the database:

   ```bash
   npx sequelize-cli db:create
   ```

5. Run migrations:

   ```bash
   npx sequelize-cli db:migrate
   ```

6. Seed the database:

   ```bash
   npm run seed
   ```

7. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd inventory-system-project/frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Database Schema

### Tables

- **Users** - User accounts with role-based access
- **InventoryItems** - Product inventory with string-based categories and units
- **Transactions** - Inventory movement records with date tracking
- **DailyInventories** - Daily inventory snapshots
- **Settings** - System configuration settings

### Key Features of the Schema

- **String-based Categories**: Uses simple string categories (FOOD, BEVERAGES, SUPPLIES, etc.)
- **String-based Units**: Uses simple string units (kg, L, pc, pkg, etc.)
- **No Foreign Key Dependencies**: Simplified structure without complex relationships
- **Date-based Tracking**: Full support for historical transaction dates
- **Audit Logging**: Tracks who made changes and when

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

## Default Users

After seeding, the following users are available:

- **Team Lead**: username: `teamlead`, password: `teamlead123`
- **Barista**: username: `barista`, password: `barista123`

## Features Overview

### Dashboard

- Overview of total items in stock
- Low stock alerts
- Today's transaction summary
- Quick access to main functions

### Inventory Management

- Add, edit, and delete inventory items
- Track beginning, in, out, spoilage, and remaining quantities
- String-based categories and units for simplicity
- Low stock monitoring

### Daily Inventory

- Generate daily inventory snapshots
- Track daily movements and changes
- Bulk edit capabilities
- Historical tracking

### User Management (Team Lead Only)

- Create and manage user accounts
- Change user passwords
- Role-based access control
- User activity tracking

### Analytics & Reports

- Visual charts and graphs
- Inventory movement tracking
- Category-wise distribution
- Stock level monitoring

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Audit logging for changes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
