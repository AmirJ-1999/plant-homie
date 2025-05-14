// src/services/UserService.js
import { API } from './api';

// ---------- SIGNUP ----------
export const signup = data => API.post('/user/signup', {
  userName    : data.username,
  password    : data.password,
  subscription: data.plan
});

// ---------- LOGIN ----------
export const login = data => API.post('/user/login', {
  userName: data.username,
  password: data.password
});
