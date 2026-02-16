# Odoo Cafe POS - Backend API

Complete RESTful API backend for the Odoo Cafe POS system built with Node.js, Express, and MySQL.

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=odoo_cafe_pos
JWT_SECRET=your_secret_key
```

3. **Set up database:**
- Run the SQL schema file in your MySQL database
- Located at: `../database/schema.sql`

4. **Start the server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user

### Users (`/api/users`)
- `GET /` - Get all users (admin only)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (admin only)

### POS Terminals (`/api/terminals`)
- `GET /` - Get all terminals
- `POST /` - Create terminal (admin only)
- `GET /:id` - Get terminal details
- `PUT /:id` - Update terminal (admin only)
- `DELETE /:id` - Delete terminal (admin only)

### POS Sessions (`/api/sessions`)
- `GET /` - Get all sessions
- `POST /open` - Open new session
- `GET /active` - Get active sessions
- `GET /:id` - Get session details
- `PUT /:id/close` - Close session

### Products (`/api/products`)
- `GET /` - Get all products
- `POST /` - Create product (admin only)
- `GET /:id` - Get product details
- `PUT /:id` - Update product (admin only)
- `DELETE /:id` - Delete product (admin only)
- `GET /category/:categoryId` - Get products by category
- `GET /:productId/variants` - Get product variants
- `POST /:productId/variants` - Create variant (admin only)
- `DELETE /:productId/variants/:id` - Delete variant (admin only)

### Categories (`/api/categories`)
- `GET /` - Get all categories
- `POST /` - Create category (admin only)
- `PUT /:id` - Update category (admin only)
- `DELETE /:id` - Delete category (admin only)
- `PUT /reorder` - Reorder categories (admin only)

### Floors (`/api/floors`)
- `GET /` - Get all floors
- `POST /` - Create floor (admin only)
- `PUT /:id` - Update floor (admin only)
- `DELETE /:id` - Delete floor (admin only)

### Tables (`/api/tables`)
- `GET /` - Get all tables
- `GET /floor/:floorId` - Get tables by floor
- `POST /` - Create table (admin only)
- `PUT /:id` - Update table (admin only)
- `PUT /:id/status` - Update table status
- `DELETE /:id` - Delete table (admin only)

### Customers (`/api/customers`)
- `GET /` - Get all customers
- `POST /` - Create customer
- `GET /:id` - Get customer details
- `PUT /:id` - Update customer
- `DELETE /:id` - Delete customer

### Orders (`/api/orders`)
- `GET /` - Get all orders
- `POST /` - Create order
- `GET /:id` - Get order details
- `PUT /:id` - Update order
- `DELETE /:id` - Delete order (draft only)
- `POST /:id/send-to-kitchen` - Send order to kitchen
- `PUT /:id/status` - Update order status
- `GET /table/:tableId` - Get orders by table

### Payments (`/api/payments`)
- `GET /` - Get all payments
- `POST /` - Process payment
- `GET /:id` - Get payment details
- `GET /order/:orderId` - Get payments by order
- `POST /generate-qr` - Generate UPI QR code

### Payment Methods (`/api/payment-methods`)
- `GET /methods/all` - Get all payment methods
- `POST /methods` - Create payment method (admin only)
- `PUT /methods/:id` - Update payment method (admin only)
- `DELETE /methods/:id` - Delete payment method (admin only)

### Kitchen Display (`/api/kitchen`)
- `GET /orders` - Get kitchen orders (kitchen staff only)
- `PUT /orders/:id/status` - Update order status (kitchen staff only)
- `PUT /items/:id/status` - Update item status (kitchen staff only)
- `GET /stats` - Get kitchen statistics (kitchen staff only)

### Mobile Orders (`/api/mobile-orders`)
- `POST /generate-token` - Generate QR token for table
- `GET /verify/:token` - Verify token and get table info
- `POST /:token/order` - Place order via mobile
- `GET /:token/menu` - Get menu for QR code

### Reports (`/api/reports`)
- `GET /dashboard` - Get dashboard stats
- `GET /sales` - Get sales report (admin only)
- `GET /top-products` - Get top selling products (admin only)
- `GET /top-categories` - Get top categories (admin only)
- `POST /export` - Export report (admin only)

## 👥 User Roles

- **admin** - Full access to all endpoints
- **cashier** - Access to POS operations, orders, payments
- **kitchen_staff** - Access to kitchen display only


## 📝 Default Credentials

After running the database schema, you can login with:
- **Email:** admin@odoocafe.com
- **Password:** admin123

## 🛠️ Technologies Used

- **Express.js** - Web framework
- **MySQL2** - Database driver
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment variables
- **cors** - CORS middleware
- **uuid** - Unique ID generation


