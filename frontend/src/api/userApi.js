import client, { createFormDataClient } from './client';

export const userApi = {
  register: async (userData) => {
    // Check if there's a profile image
    const hasFile = userData.profileImage instanceof File;
    
    if (hasFile) {
      // Use FormData for file upload
      const formData = new FormData();
      
      Object.keys(userData).forEach(key => {
        if (key === 'profileImage' && userData[key]) {
          formData.append('profileImage', userData[key]);
        } else if (key === 'address') {
          if (userData.address) {
            Object.keys(userData.address).forEach(addressKey => {
              if (userData.address[addressKey]) {
                formData.append(`address[${addressKey}]`, userData.address[addressKey]);
              }
            });
          }
        } else if (key === 'farmerDetails' || key === 'buyerDetails' || key === 'transporterDetails') {
          if (userData[key]) {
            Object.keys(userData[key]).forEach(detailKey => {
              if (userData[key][detailKey]) {
                formData.append(`${key}[${detailKey}]`, userData[key][detailKey]);
              }
            });
          }
        } else if (userData[key] !== undefined && userData[key] !== null && userData[key] !== '') {
          formData.append(key, userData[key]);
        }
      });

      const formDataClient = createFormDataClient();
      return await formDataClient.post('/users/register', formData);
    } else {
      // Use JSON for simple registration without file
      return await client.post('/users/register', userData);
    }
  },

  login: async (credentials) => {
    return await client.post('/users/login', credentials);
  },

  getProfile: async () => {
    return await client.get('/users/profile');
  },

  updateProfile: async (userData) => {
    const formData = new FormData();
    
    Object.keys(userData).forEach(key => {
      if (key === 'profileImage' && userData[key] instanceof File) {
        formData.append('profileImage', userData[key]);
      } else if (typeof userData[key] === 'object' && userData[key] !== null) {
        formData.append(key, JSON.stringify(userData[key]));
      } else if (userData[key] !== undefined && userData[key] !== null) {
        formData.append(key, userData[key]);
      }
    });

    const formDataClient = createFormDataClient();
    return await formDataClient.put('/users/profile', formData);
  },

  changePassword: async (passwords) => {
    return await client.put('/users/change-password', passwords);
  },

  getUserById: async (userId) => {
    return await client.get(`/users/${userId}`);
  },

  getAllUsers: async (params = {}) => {
    return await client.get('/users/all', { params });
  },
};

export default userApi;