import { API } from './api';

/**
 * Hent alle notifikationer for den aktuelle bruger
 * @returns {Promise} Promise med alle notifikationer
 */
export const getAllNotifications = () => API.get('/notification');

/**
 * Hent den seneste notifikation for den aktuelle bruger
 * @returns {Promise} Promise med den seneste notifikation
 */
export const getLatestNotification = () => API.get('/notification/latest');

/**
 * Opret en ny notifikation
 * @param {Object} notification - Notifikationens dataobjekt
 * @param {number} notification.Plant_ID - ID på planten denne notifikation er for
 * @param {string} notification.Message - Notifikationsbeskeden
 * @param {string} notification.Type - Notifikationstype (f.eks. "Vand", "Fugtighed", "Temperatur")
 * @returns {Promise} Promise med den oprettede notifikation
 */
export const createNotification = (notification) => API.post('/notification', notification); 