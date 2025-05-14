// src/services/PlantService.js
import axios from 'axios';

/* -------------------------------------------
   Vue-CLI henter env-variabler sådan:
   process.env.VUE_APP_*
-------------------------------------------- */
const backendUrl =
  process.env.VUE_APP_BACKEND_URL || 'https://planthomieapi2025-b4aag0cnb6d2gsf6.westeurope-01.azurewebsites.net/api';

const API = axios.create({ baseURL: backendUrl });

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
