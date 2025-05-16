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

/* ---------- GET USER DATA ---------- */
export const getUserData = (username) => 
  API.get('/user')
    .then(response => {
      // Find the user with matching username in the array
      if (Array.isArray(response.data)) {
        return response.data.find(user => user.userName === username || user.UserName === username);
      }
      return null;
    });

/* ---------- GET USER PROFILE ---------- */
export const getUserProfile = () => {
  const token = sessionStorage.getItem('token');
  return API.get('/user/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
};
