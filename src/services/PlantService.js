// src/services/PlantService.js
import { API } from '@/services/api';

export const getAllPlants   = () => API.get('/plant');
export const getLatestPlant = () => API.get('/plant/latest');

/** Opret plante (med evt. billede) */
export const createPlant = ({ name, type, file }) => {
  const form = new FormData();
  form.append('Plant_Name', name);
  form.append('Plant_type', type);
  if (file) form.append('Image', file);
  return API.post('/plant', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deletePlant = id => API.delete(`/plant/${id}`);
