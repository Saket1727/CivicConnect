import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor attaches JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor formats errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const message = error.response?.data?.message || error.message || 'Network request failed';

    if (status === 401) {
      // Clear expired credentials if unauthorized
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && currentPath !== '/') {
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
