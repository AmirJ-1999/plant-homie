// src/services/api.js
import axios from 'axios';

// Én fælles base-URL: først .env, ellers din Azure-instans
export const baseURL =
  process.env.VUE_APP_BACKEND_URL ||
  'https://planthomieapi2025-b4aag0cnb6d2gsf6.westeurope-01.azurewebsites.net/api';

export const API = axios.create({ baseURL });

// Tilføj en request interceptor til automatisk at vedhæfte tokenet
API.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Log when we're sending authenticated requests
    console.log(`Sending authenticated request to: ${config.url}`);
  } else {
    console.log(`Sending unauthenticated request to: ${config.url}`);
  }
  return config;
}, error => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Tilføj en response interceptor til global fejrhåndtering
API.interceptors.response.use(
  response => {
    console.log(`Successful response from ${response.config.url}`, response.status);
    return response;
  },
  error => {
    // Log mere detaljerede fejloplysninger
    console.error('API Fejl:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
      
      if (error.response.status === 401) {
        console.warn('Authentication error - clearing token');
        // Ryd token ved authentificeringsfejl
        sessionStorage.removeItem('token');
        
        // Hvis vi ikke er på login-siden, omdiriger til login
        if (window.location.pathname !== '/login') {
          console.warn('Redirecting to login page');
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);