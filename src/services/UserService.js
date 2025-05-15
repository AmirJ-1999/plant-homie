// src/services/UserService.js
import { API } from './api';

/* ---------- SIGNUP ---------- */
export const signup = ({ username, password, plan }) =>
  API.post('/user/signup', {
    userName    : username,
    password    : password,
    subscription: plan
  });
  
/* ---------- LOGIN ---------- */
export const login = ({ username, password }) =>
  API.post('/user/login', { userName: username, password });
