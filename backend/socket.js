const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    socket.on('join_product_room', (productId) => {
      socket.join(`product_${productId}`);
      console.log(`User ${socket.userId} joined product room: ${productId}`);
    });

    socket.on('leave_product_room', (productId) => {
      socket.leave(`product_${productId}`);
      console.log(`User ${socket.userId} left product room: ${productId}`);
    });

    socket.on('join_user_room', () => {
      socket.join(`user_${socket.userId}`);
      console.log(`User ${socket.userId} joined personal room`);
    });

    socket.on('new_bid_notification', (data) => {
      io.to(`product_${data.productId}`).emit('bid_update', {
        productId: data.productId,
        bid: data.bid,
        timestamp: new Date()
      });
    });

    socket.on('typing', (data) => {
      socket.to(`product_${data.productId}`).emit('user_typing', {
        userId: socket.userId,
        productId: data.productId
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(`product_${data.productId}`).emit('user_stop_typing', {
        userId: socket.userId,
        productId: data.productId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const emitToProduct = (productId, event, data) => {
  if (io) {
    io.to(`product_${productId}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToProduct,
  emitToUser,
  emitToAll
};