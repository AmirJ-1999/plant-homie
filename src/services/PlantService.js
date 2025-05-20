// src/services/PlantService.js
import { API } from '@/services/api';

// Helper function to extract array data from various API response formats
const extractArray = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  } else if (responseData && responseData.$values) {
    return responseData.$values;
  } else if (typeof responseData === 'object') {
    // Try to find an array property in the response
    for (const key in responseData) {
      if (Array.isArray(responseData[key])) {
        return responseData[key];
      }
    }
  }
  return []; // Return empty array as fallback
};

export const getAllPlants = () => 
  API.get('/plant').then(response => {
    console.log('Raw plant data:', response.data);
    // Return the response with modified data
    return {
      ...response,
      data: extractArray(response.data)
    };
  });

export const getLatestPlant = () => API.get('/plant/latest');

/** Opret plante (med evt. billede) */
export const createPlant = ({ name, type, file }) => {
  console.log('Creating plant with:', { name, type, fileProvided: !!file });
  
  const form = new FormData();
  form.append('Plant_Name', name);
  form.append('Plant_type', type);
  
  // Extract environment from type if it's Indoor Plant or Outdoor Plant
  const environment = type.includes('Indoor') ? 'Indoor' : 
                      type.includes('Outdoor') ? 'Outdoor' : '';
  if (environment) {
    console.log('Setting plant environment to:', environment);
    form.append('plant_environment', environment);
  }
  
  // Also include the user ID from session storage
  const userId = sessionStorage.getItem('userId');
  if (userId) {
    console.log('Adding User_ID to plant creation:', userId);
    form.append('User_ID', userId);
  } else {
    console.warn('No userId found in sessionStorage');
  }
  
  if (file) {
    console.log('Adding image file:', file.name, file.type, file.size);
    form.append('Image', file);
  }
  
  // Log the form data
  for (let pair of form.entries()) {
    console.log('Form entry:', pair[0], pair[1]);
  }
  
  return API.post('/plant', form, {
    headers: { 
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deletePlant = id => API.delete(`/plant/${id}`);
