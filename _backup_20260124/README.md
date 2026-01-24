# Odoo Cafe POS System

A comprehensive Point of Sale system for restaurants and cafes, built with React, Node.js, and MySQL.

## 🚀 Features (Phase 1 - Authentication)

- ✅ User Registration (Signup)
- ✅ User Login with JWT Authentication
- ✅ Protected Routes
- ✅ Beautiful UI with Tailwind CSS
- ✅ Role-based Access (POS User, Kitchen User, Admin)

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL Server (v8 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Team-Payal---Odoo-Cafe-POS
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory (already created, update if needed):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=odoo_cafe_pos
DB_PORT=3306
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database

Make sure MySQL is running, then execute:

```bash
npm run setup-db
```

This will create the database and all necessary tables.

### 4. Setup Frontend

```bash
cd ../frontend
npm install
```

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on: http://localhost:5000

### Start Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will run on: http://localhost:5173

## 📱 Usage

1. Navigate to http://localhost:5173
2. Click "Sign up here" to create a new account
3. Fill in the registration form:
   - Username
   - Email
   - Role (POS User, Kitchen User, or Admin)
   - Password
4. After successful registration, you'll be redirected to the login page
5. Login with your credentials
6. You'll be redirected to the dashboard

## 🎨 Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express.js
- MySQL2
- JWT (jsonwebtoken)
- bcryptjs
- CORS

## 📁 Project Structure

```
Team-Payal---Odoo-Cafe-POS/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── authController.js
│   ├── routes/
│   │   └── auth.js
│   ├── scripts/
│   │   └── setup-db.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.jpeg
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Signup.jsx
│   │   │   └── Dashboard/
│   │   │       └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── .gitignore
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

## 🎯 Next Steps

The following features will be implemented in upcoming phases:
- Dashboard with POS terminal configuration
- Product management
- Order processing
- Kitchen Display System
- Payment integration (Cash, Digital, UPI)
- Customer Display
- Reporting & Analytics

## 📄 License

This project is part of the Odoo Cafe POS Hackathon.
