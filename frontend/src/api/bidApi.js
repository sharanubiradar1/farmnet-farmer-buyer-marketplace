import client from './client';

export const bidApi = {
  createBid: async (bidData) => {
    return await client.post('/bids', bidData);
  },

  getBidsByProduct: async (productId, params = {}) => {
    return await client.get(`/bids/product/${productId}`, { params });
  },

  getMyBids: async (params = {}) => {
    return await client.get('/bids/my-bids', { params });
  },

  getBidsOnMyProducts: async (params = {}) => {
    return await client.get('/bids/received-bids', { params });
  },

  acceptBid: async (bidId, message = null) => {
    return await client.put(`/bids/${bidId}/accept`, { message });
  },

  rejectBid: async (bidId, message = null) => {
    return await client.put(`/bids/${bidId}/reject`, { message });
  },

  withdrawBid: async (bidId) => {
    return await client.put(`/bids/${bidId}/withdraw`);
  },
};

export default bidApi;