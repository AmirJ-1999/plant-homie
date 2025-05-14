// src/services/UserService.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.VUE_APP_BACKEND_URL || 'https://planthomieapi2025-b4aag0cnb6d2gsf6.westeurope-01.azurewebsites.net/api'
});

export const signup = data => API.post('/user/signup', data); // {userName, password, subscription}
export const login  = data => API.post('/user/login',  data); // {userName, password}
