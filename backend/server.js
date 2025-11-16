const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const { initializeSocket } = require('./socket');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const bidRoutes = require('./routes/bidRoutes');
const transportRoutes = require('./routes/transportRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

connectDB();

initializeSocket(server);

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.get('/', (req, res) => {
  res.json({
    message: 'FarmNet API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
      bids: '/api/bids',
      transport: '/api/transport'
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/transport', transportRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║        FarmNet Backend Server             ║
╠═══════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV?.toUpperCase().padEnd(28)}║
║  Port: ${PORT.toString().padEnd(35)}║
║  Status: RUNNING                          ║
╚═══════════════════════════════════════════╝
  `);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;