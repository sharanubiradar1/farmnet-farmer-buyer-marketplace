# FarmNet - Farmer-Buyer Marketplace

A full-stack web application connecting farmers directly with buyers through a decentralized marketplace with real-time bidding.

## Features

- **Role-Based System**: Farmers, Buyers, and Transporters
- **Real-Time Bidding**: Live bid updates using Socket.IO
- **Product Management**: Create, update, and manage agricultural products
- **Authentication**: Secure JWT-based authentication
- **Dashboard**: Role-specific dashboards with analytics
- **File Upload**: Multiple image upload for products
- **Transport Tracking**: Track deliveries from pickup to delivery

## Tech Stack

**Frontend:**
- React 18
- React Router DOM
- Axios
- Socket.IO Client
- React Hot Toast

**Backend:**
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT
- Bcrypt.js
- Multer

## Installation

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/farmnet
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

Start server:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start app:
```bash
npm start
```

## Usage

1. Register as Farmer/Buyer/Transporter
2. **Farmers**: Add products, manage bids
3. **Buyers**: Browse products, place bids
4. **Transporters**: Manage deliveries

## API Endpoints

### Users
- POST `/api/users/register` - Register user
- POST `/api/users/login` - Login user
- GET `/api/users/profile` - Get profile

### Products
- GET `/api/products` - Get all products
- POST `/api/products` - Create product (Farmer)
- GET `/api/products/:id` - Get product details
- PUT `/api/products/:id` - Update product (Farmer)
- DELETE `/api/products/:id` - Delete product (Farmer)

### Bids
- POST `/api/bids` - Place bid (Buyer)
- GET `/api/bids/my-bids` - Get my bids (Buyer)
- GET `/api/bids/received-bids` - Get received bids (Farmer)
- PUT `/api/bids/:id/accept` - Accept bid (Farmer)
- PUT `/api/bids/:id/reject` - Reject bid (Farmer)

### Transport
- POST `/api/transport` - Create transport (Transporter)
- GET `/api/transport/my-transports` - Get my transports
- PUT `/api/transport/:id/status` - Update status (Transporter)

## Project Structure

```
FarmNet/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── socket.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── pages/
        ├── socket/
        └── App.js
```
## Author

Sharanagouda Biradar
