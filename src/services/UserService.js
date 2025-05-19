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

/* Funktion til at opdatere en brugers abonnement */
export const updateUserSubscription = (userId, subscriptionPlan) => {
  console.log(`Updating subscription for user ${userId} to ${subscriptionPlan}`);
  
  // Format the request body exactly as expected by the backend controller
  const requestData = {
    subscription: subscriptionPlan,
    Subscription: subscriptionPlan // Include PascalCase version for API compatibility
  };
  
  console.log('Request data:', requestData);
  
  return API.put(`/user/${userId}`, requestData)
    .then(response => {
      console.log('Subscription update response:', response);
      return response;
    })
    .catch(error => {
      console.error('Subscription update error:', error.response || error);
      throw error;
    });
};

/* Funktion til at hente en enkelt bruger ved ID */
export const getUserById = (userId) => {
  return API.get(`/user/${userId}`)
    .then(response => {
      console.log('GetUserById response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('GetUserById error:', error.response || error);
      return {
        status: error.response?.status || 500,
        data: null
      };
    });
};
