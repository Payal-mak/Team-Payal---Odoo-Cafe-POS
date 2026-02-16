# Odoo Cafe POS - Frontend

Modern React-based frontend for the Odoo Cafe POS system.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment (optional):**
Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

3. **Start development server:**
```bash
npm run dev
```

The app will start on `http://localhost:3000`

4. **Build for production:**
```bash
npm run build
```

## 📋 Features

- **Authentication** - JWT-based login with role management
- **Dashboard** - Real-time statistics and insights
- **POS Register** - Full point of sale interface
- **Floor Plan** - Visual table management
- **Kitchen Display** - Real-time order tracking for kitchen
- **Product Management** - CRUD operations for products and categories
- **Order Management** - View and manage all orders
- **Customer Management** - Customer database
- **Reports** - Sales analytics and insights
- **Real-time Updates** - WebSocket integration for live updates

## 🎨 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **React Hook Form** - Form management
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
src/
├── components/        # Reusable components
│   ├── common/       # Common UI components
│   └── layout/       # Layout components
├── pages/            # Page components
├── context/          # React contexts
├── services/         # API services
├── hooks/            # Custom hooks
├── styles/           # Global styles
└── utils/            # Utility functions
```

## 🔐 Default Login

- **Email:** admin@odoocafe.com
- **Password:** admin123

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎨 Design System

The app uses a warm, coffee-shop themed design with:
- Primary color: `#2D5F5D` (Deep teal)
- Accent color: `#F4A261` (Warm orange)
- Custom Outfit font family
- Responsive design for all screen sizes

## 📄 License

ISC
