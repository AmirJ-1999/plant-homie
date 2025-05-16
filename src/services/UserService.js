// src/services/UserService.js
import { API } from './api';

/* Funktion til oprettelse af ny bruger */
export const signup = ({ username, password, plan }) =>
  API.post('/user/signup', {
    userName    : username,
    password    : password,
    subscription: plan
  });
  
/* Funktion til at logge en bruger ind */
export const login = ({ username, password }) =>
  API.post('/user/login', { userName: username, password });

/* Funktion til at hente specifikke brugerdata (bemærk: henter pt. alle og filtrerer) */
export const getUserData = (username) => 
  API.get('/user')
    .then(response => {
      // Leder efter brugeren med det rigtige brugernavn i listen vi fik tilbage
      if (Array.isArray(response.data)) {
        return response.data.find(user => user.userName === username || user.UserName === username);
      }
      return null;
    });

/* Funktion til at hente den aktuelle brugers profil */
export const getUserProfile = () => {
  const token = sessionStorage.getItem('token');
  return API.get('/user/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
};
