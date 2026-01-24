# Odoo Cafe POS System

A modern Point of Sale (POS) system for cafes built with React, Node.js, Express, and MySQL.

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL2** - MySQL client with Promise support
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Database
- **MySQL** - Relational database

## 📁 Project Structure

```
Team-Payal---Odoo-Cafe-POS/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── routes/       # API routes
│   │   └── server.js     # Express app
│   ├── .env              # Environment variables
│   └── package.json
├── odoo_cafe_pos.sql     # Database schema
└── package.json          # Root package.json
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
cd Team-Payal---Odoo-Cafe-POS
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

Or use the convenience script:
```bash
npm run install:all
```

### 3. Database Setup

1. Start your MySQL server
2. Create the database and tables:
```bash
mysql -u root -p < odoo_cafe_pos.sql
```

Or manually:
```sql
mysql -u root -p
source odoo_cafe_pos.sql
```

### 4. Configure Environment Variables

The backend `.env` file is already configured with:
```env
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=odoo_cafe_pos
```

Update `DB_PASSWORD` if your MySQL password is different.

### 5. Run the Application

#### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev
```

#### Option 2: Run Separately

**Backend:**
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

**Frontend:**
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```

### 6. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

## 📊 Database Schema

The system includes the following tables:
- `users` - User authentication and roles
- `categories` - Product categories
- `products` - Product catalog
- `product_variants` - Product variations
- `pos_configs` - POS terminal configurations
- `floors` - Restaurant floor layout
- `tables` - Table management
- `pos_sessions` - POS session tracking
- `customers` - Customer information
- `orders` - Order management
- `order_lines` - Order line items
- `self_order_tokens` - Self-service tokens

## 🔌 API Endpoints

### Health Check
- `GET /api/health` - Server health check
- `GET /api/health/db` - Database connection check
- `GET /api/health/tables` - List all database tables

## 🎨 Design System

The application uses a warm, coffee-inspired color palette:
- **Coffee tones** - Primary actions and accents
- **Cream tones** - Backgrounds and surfaces
- **Espresso tones** - Text and dark elements

Custom TailwindCSS classes:
- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.card` - Card container
- `.input-field` - Form input style

## 🚧 MVP Roadmap

### ✅ Step 1: Project Skeleton & Database Connection (COMPLETED)
- [x] Monorepo setup with React (Vite) and Node.js/Express
- [x] MySQL database connection
- [x] TailwindCSS configuration
- [x] Health check API endpoints

### 🔜 Next Steps
- Step 2: User authentication and role management
- Step 3: Product catalog management
- Step 4: Order creation and management
- Step 5: Kitchen display system
- Step 6: Payment processing

## 🤝 Contributing

This is a hackathon project. For any issues or suggestions, please create an issue in the repository.

## 📝 License

ISC
