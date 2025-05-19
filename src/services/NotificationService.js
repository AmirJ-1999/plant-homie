import { API } from './api';

/**
 * Process and extract notification data from backend response
 * @param {Object} responseData - The raw response data from the API
 * @returns {Array} Array of notification objects
 */
const extractNotifications = (responseData) => {
  // Check if data has $values format (common in .NET serialization)
  if (responseData && responseData.$values) {
    return responseData.$values.map(notification => {
      // Create a clean notification object without circular references
      return {
        notification_ID: notification.notification_ID,
        dato_Tid: notification.dato_Tid,
        type: notification.plant_Type || 'System',
        message: notification.message || 'System notification',
        plant_ID: notification.plant_ID,
        user_ID: notification.user_ID,
        plant: notification.plant ? {
          plant_ID: notification.plant.plant_ID,
          plant_Name: notification.plant.plant_Name,
          plant_type: notification.plant.plant_type
        } : null
      };
    });
  } 
  // Already an array
  else if (Array.isArray(responseData)) {
    return responseData;
  }
  // Single notification object (like from /notification/latest when there's only one notification)
  else if (responseData && (responseData.notification_ID !== undefined || responseData.message !== undefined)) {
    return [{
      notification_ID: responseData.notification_ID || 0,
      dato_Tid: responseData.dato_Tid || new Date().toISOString(),
      type: responseData.plant_Type || responseData.type || 'System',
      message: responseData.message || 'System notification',
      plant_ID: responseData.plant_ID,
      user_ID: responseData.user_ID,
      plant: responseData.plant ? {
        plant_ID: responseData.plant.plant_ID,
        plant_Name: responseData.plant.plant_Name,
        plant_type: responseData.plant.plant_type
      } : null
    }];
  }
  // Cannot handle this format
  else {
    console.warn('Unknown notification data format:', responseData);
    return [];
  }
};

/**
 * Hent alle notifikationer for den aktuelle bruger
 * @returns {Promise} Promise med alle notifikationer
 */
export const getAllNotifications = () => 
  API.get('/notification').then(response => {
    console.log('Raw notification data:', response.data);
    return {
      ...response,
      data: extractNotifications(response.data)
    };
  });

/**
 * Hent den seneste notifikation for den aktuelle bruger
 * @returns {Promise} Promise med den seneste notifikation
 */
export const getLatestNotification = () => 
  API.get('/notification/latest').then(response => {
    const notifications = extractNotifications(response.data);
    if (notifications && notifications.length > 0) {
      return { ...response, data: notifications[0] };
    }
    return response;
  });

/**
 * Opret en ny notifikation
 * @param {Object} notification - Notifikationens dataobjekt
 * @param {number} notification.Plant_ID - ID på planten denne notifikation er for
 * @param {string} notification.Message - Notifikationsbeskeden
 * @param {string} notification.Type - Notifikationstype (f.eks. "Vand", "Fugtighed", "Temperatur")
 * @returns {Promise} Promise med den oprettede notifikation
 */
export const createNotification = (notification) => {
  // Make sure the API endpoint starts with a slash
  const endpoint = '/notification';
  console.log('Creating notification with data:', notification);
  
  // Check if notification has required fields
  if (!notification.Message && !notification.message) {
    console.error('Notification missing required Message field');
    return Promise.reject(new Error('Notification missing required Message field'));
  }
  
  if (!notification.Plant_ID && !notification.plant_ID) {
    console.error('Notification missing required Plant_ID field');
    return Promise.reject(new Error('Notification missing required Plant_ID field'));
  }
  
  // Ensure we have both pascal and camel case versions of properties
  const normalizedNotification = {
    ...notification,
    Plant_ID: notification.Plant_ID || notification.plant_ID,
    plant_ID: notification.plant_ID || notification.Plant_ID,
    Message: notification.Message || notification.message, 
    message: notification.message || notification.Message,
    Type: notification.Type || notification.type,
    type: notification.type || notification.Type
  };
  
  return API.post(endpoint, normalizedNotification);
}; 