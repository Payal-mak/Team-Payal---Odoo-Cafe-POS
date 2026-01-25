# Odoo Cafe POS

A complete Point of Sale system for cafes and restaurants built with React, Node.js, and MySQL.

## 🎯 Project Overview

Odoo Cafe POS is a comprehensive restaurant management system that includes:
- **POS Backend** - Configuration & management
- **POS Frontend** - Cashier terminal
- **Kitchen Display System (KDS)** - Order tracking
- **Customer Display** - Real-time order view
- **Reporting & Analytics** - Business insights

## 📁 Project Structure

```
Team-Payal---Odoo-Cafe-POS/
├── frontend/          # React frontend application
├── backend/           # Node.js/Express API server
└── odoo_cafe_pos.sql  # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

### 1. Database Setup

Create the database and import schema:
```sql
CREATE DATABASE odoo_cafe_pos;
```

Then import the SQL file:
```bash
mysql -u root -p odoo_cafe_pos < odoo_cafe_pos.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
node server.js
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## ✨ Features Implemented

### ✅ Phase 1: Authentication
- User signup/login with JWT authentication
- Password hashing and secure storage
- Role-based access (POS User, Kitchen User, Admin)
- Protected API routes

### ✅ Phase 2: Dashboard
- Real-time statistics (orders, revenue, products)
- POS terminal management
- Create and configure terminals
- User profile and logout

### 🚧 Coming Soon
- POS Terminal configuration (payment methods, tables)
- Product management
- Order processing
- Kitchen Display System
- Customer Display
- Reporting and analytics

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- CSS3 (Custom design system)

**Backend:**
- Node.js
- Express.js
- MySQL2
- JWT (jsonwebtoken)
- bcryptjs

## 📖 Documentation

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## 🎨 Design

The application features a premium cafe-themed design with:
- Warm color palette (browns, oranges, creams)
- Modern glassmorphism effects
- Smooth animations and transitions
- Fully responsive layout

## 🔐 Default Credentials

After setting up, you can create a new account through the signup page.

## 📝 License

ISC

## 👥 Team

Team Payal - Odoo Cafe POS
