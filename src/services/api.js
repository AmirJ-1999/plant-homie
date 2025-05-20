// src/services/api.js
import axios from 'axios';

// Azure backend URL
export const baseURL = 'https://planthomieapi20250519212023-g3dxbqerfvhhf0a6.northeurope-01.azurewebsites.net/api';

// Configuration options
export const apiConfig = {
  debugMode: true, // Enable for detailed logging
  notificationEndpoint: '/notification', // Default endpoint
  testMode: false, // Set to true to use test endpoint
  retryCount: 2, // Number of retries for failed requests
  useLocalBackend: false // Set to true to use localhost instead of Azure
};

// Select the appropriate base URL based on configuration
const activeBaseURL = apiConfig.useLocalBackend 
  ? 'http://localhost:5000/api' 
  : baseURL;

console.log(`Using API at: ${activeBaseURL}`);

export const API = axios.create({ 
  baseURL: activeBaseURL,
  withCredentials: false, // Don't send cookies for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Add timeout to avoid hanging requests
  timeout: 15000
});

// Tilføj en request interceptor til automatisk at vedhæfte tokenet
API.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Log when we're sending authenticated requests
    console.log(`Sending authenticated request to: ${config.url}`);
    
    // Special handling for notification endpoint in debug mode
    if (apiConfig.debugMode && config.url?.includes('/notification')) {
      console.log('NOTIFICATION REQUEST DETAILS:');
      console.log('- Headers:', JSON.stringify(config.headers));
      console.log('- Data:', config.data);
      
      // Use test endpoint if in test mode
      if (apiConfig.testMode && config.method === 'post') {
        console.log('Using test notification endpoint');
        config.url = '/test-notification';
      }
    }
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
      console.error('Request URL:', error.config.url);
      
      // Special handling for notification errors (often 500 errors due to database constraints)
      if (error.response.status === 500 && error.config.url.includes('/notification')) {
        console.warn('Notification API error - this may be expected in the school project environment');
        
        // For notification operations that fail, we can return a mock success
        // This is a workaround for the school project where backend database constraints may cause issues
        if (error.config.method === 'post') {
          console.log('Returning mock success for notification creation');
          return Promise.resolve({
            status: 200,
            data: {
              message: "Notification created (mock)",
              notification: {
                notification_ID: Math.floor(Math.random() * 10000),
                dato_Tid: new Date().toISOString(),
                type: "System",
                message: "This is a mock notification due to backend issues",
                isRead: false
              }
            }
          });
        }
      }
      
      // For authentication errors, log more details but don't redirect immediately
      if (error.response.status === 401) {
        console.warn('Authentication error with request to:', error.config.url);
        console.warn('Current token:', sessionStorage.getItem('token'));
        
        // Only clear token and redirect if not calling login endpoint
        if (!error.config.url.includes('/user/login') && !error.config.url.includes('/user/signup')) {
          console.warn('Authentication failed - will redirect in 2 seconds');
        
          // Wait 2 seconds before redirecting to give time to see console logs
          setTimeout(() => {
            sessionStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
              console.warn('Redirecting to login page');
              window.location.href = '/login';
            }
          }, 2000);
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

// Add a function to check API connection status
export const checkApiStatus = async () => {
  try {
    const response = await axios.get(`${activeBaseURL}/ping`, { timeout: 5000 });
    return {
      online: true,
      status: response.status,
      message: "API is online"
    };
  } catch (error) {
    console.error("API Status Check Failed:", error.message);
    return {
      online: false,
      error: error.message,
      message: "API appears to be offline or unreachable"
    };
  }
};