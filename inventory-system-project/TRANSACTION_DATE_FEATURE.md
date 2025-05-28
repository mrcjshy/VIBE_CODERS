# Transaction Date Feature

## Overview

The inventory system now supports manual transaction date selection, allowing staff and admin users to record transactions for specific dates instead of just the current date. This is particularly useful for:

- Recording inventory changes that happened on previous days
- Backdating transactions when inventory is counted the next day
- Correcting historical inventory records

## Features

### Frontend

- **Date Picker Component**: All transaction forms now include a date picker field
- **Default Value**: Automatically sets to current server date
- **Validation**:
  - Prevents future dates (beyond today)
  - Limits backdating to a maximum of 7 days
  - Shows clear validation messages
- **New Transactions Page**: Dedicated page for creating and managing transactions
- **Date Range Filtering**: Filter transaction history by date range
- **Navigation**: Added "Transactions" link to sidebar navigation

### Backend

- **System Date API**: New endpoint `/api/transactions/system-date` to get current server date
- **Enhanced Transaction Creation**: Accepts and validates date parameter
- **Automatic Inventory Updates**: Creates transactions and updates inventory levels atomically
- **Date-based Queries**: All dashboard and statistics queries use transaction date field
- **Database Indexing**: Added indexes for better performance on date-based queries

### Database

- **Date Column**: Uses existing `date` field in transactions table
- **Indexes**: Added performance indexes:
  - `transactions_date_idx` - Single date index
  - `transactions_date_type_idx` - Composite date + type index
  - `transactions_item_date_idx` - Composite inventory item + date index

## API Endpoints

### Get System Date

```
GET /api/transactions/system-date
```

Returns current server date in YYYY-MM-DD format.

**Response:**

```json
{
  "date": "2024-03-15",
  "time": "2024-03-15T14:30:00.000Z",
  "timezone": "America/New_York"
}
```

### Create Transaction with Date

```
POST /api/transactions
```

**Request Body:**

```json
{
  "inventoryItemId": 1,
  "type": "in|out|spoilage|adjustment",
  "quantity": 10,
  "notes": "Optional notes",
  "reason": "Optional reason",
  "date": "2024-03-14"
}
```

**Response:**

```json
{
  "message": "Transaction created successfully",
  "transaction": {
    "id": 123,
    "inventoryItemId": 1,
    "type": "in",
    "quantity": 10,
    "date": "2024-03-14T00:00:00.000Z",
    "InventoryItem": {
      "name": "Rice",
      "remaining": 150,
      "totalInventory": 200
    }
  }
}
```

## Usage Examples

### Frontend Components

#### Using TransactionForm Component

```jsx
import TransactionForm from "../components/TransactionForm";

function MyComponent() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button onClick={() => setShowForm(true)}>Create Transaction</button>

      <TransactionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          // Refresh data
          setShowForm(false);
        }}
        type="in" // 'in', 'out', 'spoilage'
      />
    </div>
  );
}
```

#### Using API Service

```javascript
import { transactionService } from "../services/api";

// Get system date
const dateResponse = await transactionService.getSystemDate();
console.log("Server date:", dateResponse.data.date);

// Create transaction with custom date
const transactionData = {
  inventoryItemId: 1,
  type: "in",
  quantity: 25,
  date: "2024-03-14",
  notes: "Backdated inventory receipt",
};

const response = await transactionService.createTransaction(transactionData);
```

## Validation Rules

### Date Validation

1. **Future Dates**: Not allowed - transactions cannot be created for future dates
2. **Past Dates**: Limited to 7 days maximum (configurable in backend)
3. **Format**: Must be valid YYYY-MM-DD format
4. **Required**: Date field is mandatory

### Business Logic

- **Stock Validation**: For 'out' and 'spoilage' transactions, validates sufficient inventory
- **Atomic Updates**: Uses database transactions to ensure data consistency
- **Audit Trail**: All transactions include user ID and timestamp information

## Configuration

### Backend Configuration

The maximum days back can be configured in the transaction controller:

```javascript
// In transactionController.js
const maxDaysBack = 7; // Allow up to 7 days back
```

### Frontend Configuration

Date picker constraints are automatically set based on server response and can be customized in the TransactionForm component.

## Migration

Run the database migration to add performance indexes:

```bash
cd backend
npx sequelize-cli db:migrate
```

This creates:

- `20240305000005-add-transaction-date-index.js`

## Testing

Use the included test script to verify functionality:

```bash
node test-transaction-date.js
```

Tests include:

- System date API functionality
- Transaction creation with custom dates
- Date validation (future dates should fail)
- Inventory level updates

## Navigation

The new feature can be accessed through:

1. **Sidebar Navigation**: Click "Transactions" in the sidebar
2. **Dashboard**: Use existing modal functionality with date selection
3. **Direct URL**: `/transactions`

## Benefits

1. **Flexibility**: Record transactions for any valid past date
2. **Accuracy**: Correct historical inventory records
3. **Compliance**: Meet audit requirements for accurate dating
4. **User Experience**: Intuitive date picker interface
5. **Performance**: Optimized database queries with proper indexing
6. **Data Integrity**: Atomic operations ensure consistency

## Future Enhancements

Potential improvements:

- Bulk transaction import with dates
- Date range restrictions by user role
- Transaction approval workflow for backdated entries
- Integration with external systems for automatic date setting
