# Odoo Cafe POS - Quick Start Guide

## 🚀 Quick Start

### Start the Application
```bash
# From the root directory
npm run dev
```

This will start:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

### Access the Application
Open your browser and navigate to: **http://localhost:5173**

You should see the Odoo Cafe POS health dashboard with:
- ✅ Server status
- ✅ Database connection status
- ✅ List of 12 database tables

---

## 📋 Useful Commands

### Root Directory
```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend
```

### Backend Directory
```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Frontend Directory
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/health/db` | GET | Database connection check |
| `/api/health/tables` | GET | List all database tables |

---

## 🗄️ Database Access

```bash
# Connect to MySQL
mysql -u root -ppassword

# Use the database
USE odoo_cafe_pos;

# Show all tables
SHOW TABLES;

# View users table
SELECT * FROM users;
```

---

## 🎨 Design System

### Colors
- **Coffee**: Primary actions (#8b6940)
- **Cream**: Backgrounds (#fefdfb)
- **Espresso**: Text (#2d2520)

### Custom Classes
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.card` - Card container
- `.input-field` - Form input

---

## 📁 Project Structure

```
Team-Payal---Odoo-Cafe-POS/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── services/     # API services
│   │   └── App.jsx       # Main app
│   └── package.json
├── backend/              # Express API
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── routes/       # API routes
│   │   └── server.js     # Server
│   └── package.json
└── package.json          # Root scripts
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if MySQL is running
mysql -u root -ppassword -e "SELECT 1"

# Check if port 3000 is available
netstat -ano | findstr :3000
```

### Frontend won't start
```bash
# Check if port 5173 is available
netstat -ano | findstr :5173

# Clear node_modules and reinstall
cd frontend
rm -rf node_modules
npm install
```

### Database connection error
1. Verify MySQL is running
2. Check credentials in `backend/.env`
3. Ensure database `odoo_cafe_pos` exists

---

## ✅ MVP Step 1 Complete!

You now have:
- ✅ Monorepo with React + Node.js
- ✅ MySQL database with 12 tables
- ✅ Health check APIs
- ✅ Beautiful coffee-themed UI
- ✅ TailwindCSS styling

**Next**: Proceed to Step 2 - User Authentication & Role Management
