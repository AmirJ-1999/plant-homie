// src/services/api.js
import axios from 'axios';

// Én fælles base-URL: først .env, ellers din Azure-instans
export const baseURL =
  process.env.VUE_APP_BACKEND_URL ||
  'https://planthomieapi2025-b4aag0cnb6d2gsf6.westeurope-01.azurewebsites.net/api';

export const API = axios.create({ baseURL });

// Add a request interceptor to automatically attach the token
API.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});