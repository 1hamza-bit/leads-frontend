// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Matches your Flask blueprint prefix
});

// REQUEST Interceptor: Attach the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE Interceptor: Handle the 401 "Expired" error
api.interceptors.response.use(
  (response) => response, // If request is successful, do nothing
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired. Logging out...");
      
        localStorage.removeItem('lg_campaigns');
    localStorage.removeItem('lg_global_leads');
      localStorage.removeItem('lg_all_users');
      localStorage.removeItem('lg_all_users');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_session');

      
      // 2. Force a redirect to login
      // We use window.location because we are outside a React component
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;