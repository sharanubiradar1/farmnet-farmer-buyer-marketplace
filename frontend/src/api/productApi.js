import client, { createFormDataClient } from './client';

export const productApi = {
  createProduct: async (productData) => {
    const formData = new FormData();
    
    Object.keys(productData).forEach(key => {
      if (key === 'images' && productData[key]) {
        Array.from(productData[key]).forEach(file => {
          formData.append('productImages', file);
        });
      } else if (typeof productData[key] === 'object' && productData[key] !== null) {
        formData.append(key, JSON.stringify(productData[key]));
      } else {
        formData.append(key, productData[key]);
      }
    });

    const formDataClient = createFormDataClient();
    return await formDataClient.post('/products', formData);
  },

  getAllProducts: async (params = {}) => {
    return await client.get('/products', { params });
  },

  getProductById: async (productId) => {
    return await client.get(`/products/${productId}`);
  },

  updateProduct: async (productId, productData) => {
    const formData = new FormData();
    
    Object.keys(productData).forEach(key => {
      if (key === 'images' && productData[key]) {
        if (productData[key] instanceof FileList || Array.isArray(productData[key])) {
          Array.from(productData[key]).forEach(file => {
            formData.append('productImages', file);
          });
        }
      } else if (typeof productData[key] === 'object' && productData[key] !== null) {
        formData.append(key, JSON.stringify(productData[key]));
      } else if (productData[key] !== undefined && productData[key] !== null) {
        formData.append(key, productData[key]);
      }
    });

    const formDataClient = createFormDataClient();
    return await formDataClient.put(`/products/${productId}`, formData);
  },

  deleteProduct: async (productId) => {
    return await client.delete(`/products/${productId}`);
  },

  getMyProducts: async (params = {}) => {
    return await client.get('/products/my-products', { params });
  },

  getFeaturedProducts: async (params = {}) => {
    return await client.get('/products/featured', { params });
  },
};

export default productApi;