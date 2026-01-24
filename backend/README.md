# Odoo Cafe POS - Backend

Node.js/Express backend API for the Odoo Cafe POS system.

## Features

- 🔐 JWT-based authentication
- 🗄️ MySQL database integration
- 📊 Dashboard API endpoints
- 🔒 Protected routes with middleware
- ✅ Input validation

## Tech Stack

- Node.js
- Express.js
- MySQL2
- JWT (jsonwebtoken)
- bcryptjs
- CORS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE odoo_cafe_pos;
```

2. Import the SQL schema from `Team-Payal---Odoo-Cafe-POS/odoo_cafe_pos.sql`

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=odoo_cafe_pos
```

### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Dashboard
- `GET /api/dashboard` - Get dashboard data (protected)
- `POST /api/dashboard/terminal` - Create POS terminal (protected)

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
backend/
├── config/
│   └── database.js       # Database connection
├── controllers/
│   ├── authController.js # Authentication logic
│   └── dashboardController.js # Dashboard logic
├── middleware/
│   └── auth.js           # JWT verification
├── routes/
│   ├── authRoutes.js     # Auth routes
│   └── dashboardRoutes.js # Dashboard routes
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json
└── server.js             # Main server file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| DB_HOST | MySQL host | localhost |
| DB_USER | MySQL user | root |
| DB_PASSWORD | MySQL password | - |
| DB_NAME | Database name | odoo_cafe_pos |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRE | Token expiration | 7d |
| FRONTEND_URL | Frontend URL | http://localhost:5173 |
