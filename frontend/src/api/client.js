import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
      });
    } else {
      return Promise.reject({
        success: false,
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
);

export const createFormDataClient = () => {
  const formDataClient = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  formDataClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  formDataClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error.response.data);
      }
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
      });
    }
  );

  return formDataClient;
};

export default client;