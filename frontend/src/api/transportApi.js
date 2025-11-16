import client from './client';

export const transportApi = {
  createTransport: async (transportData) => {
    return await client.post('/transport', transportData);
  },

  getAllTransports: async (params = {}) => {
    return await client.get('/transport', { params });
  },

  getTransportById: async (transportId) => {
    return await client.get(`/transport/${transportId}`);
  },

  getMyTransports: async (params = {}) => {
    return await client.get('/transport/my-transports', { params });
  },

  getActiveTransports: async () => {
    return await client.get('/transport/active');
  },

  updateTransportStatus: async (transportId, statusData) => {
    return await client.put(`/transport/${transportId}/status`, statusData);
  },

  cancelTransport: async (transportId, reason = null) => {
    return await client.put(`/transport/${transportId}/cancel`, { reason });
  },

  addTransportRating: async (transportId, ratingData) => {
    return await client.post(`/transport/${transportId}/rating`, ratingData);
  },
};

export default transportApi;