import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token) => {
  if (!token) {
    console.error('No token provided for socket connection');
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected manually');
  }
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const joinProductRoom = (productId) => {
  if (socket && socket.connected) {
    socket.emit('join_product_room', productId);
    console.log('Joined product room:', productId);
  }
};

export const leaveProductRoom = (productId) => {
  if (socket && socket.connected) {
    socket.emit('leave_product_room', productId);
    console.log('Left product room:', productId);
  }
};

export const joinUserRoom = () => {
  if (socket && socket.connected) {
    socket.emit('join_user_room');
    console.log('Joined personal room');
  }
};

export const onBidUpdate = (callback) => {
  if (socket) {
    socket.on('bid_update', callback);
  }
};

export const onNewBid = (callback) => {
  if (socket) {
    socket.on('new_bid', callback);
  }
};

export const onBidNotification = (callback) => {
  if (socket) {
    socket.on('bid_notification', callback);
  }
};

export const onBidAccepted = (callback) => {
  if (socket) {
    socket.on('bid_accepted', callback);
  }
};

export const onBidRejected = (callback) => {
  if (socket) {
    socket.on('bid_rejected', callback);
  }
};

export const onTransportCreated = (callback) => {
  if (socket) {
    socket.on('transport_created', callback);
  }
};

export const onTransportUpdate = (callback) => {
  if (socket) {
    socket.on('transport_update', callback);
  }
};

export const onTransportCancelled = (callback) => {
  if (socket) {
    socket.on('transport_cancelled', callback);
  }
};

export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners();
  }
};

export default {
  initializeSocket,
  disconnectSocket,
  getSocket,
  joinProductRoom,
  leaveProductRoom,
  joinUserRoom,
  onBidUpdate,
  onNewBid,
  onBidNotification,
  onBidAccepted,
  onBidRejected,
  onTransportCreated,
  onTransportUpdate,
  onTransportCancelled,
  removeAllListeners,
};