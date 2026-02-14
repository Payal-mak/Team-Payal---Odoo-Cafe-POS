# Odoo Cafe POS

Restaurant POS (Point of Sale) system with table-based ordering, multiple payment methods, kitchen display, and reporting.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js, Express
- **Database:** MySQL

## Setup

### Database

1. Create MySQL database and run schema:
   ```bash
   mysql -u root -p < schema.sql
   ```
2. Default credentials in `.env`: host=localhost, user=root, password=password, database=odoo_cafe_pos

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API runs at `http://localhost:5000`. Health check: `GET /api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Branch

This project is on the **new** branch: https://github.com/Payal-mak/Team-Payal---Odoo-Cafe-POS/tree/new
