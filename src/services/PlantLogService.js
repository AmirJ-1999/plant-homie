import { API, baseURL } from './api';

/**
 * Process and extract plant log data from backend response
 * @param {Object} responseData - The raw response data from the API
 * @returns {Array} Array of plant log objects
 */
const extractPlantLogs = (responseData) => {
  // Check if data has $values format (common in .NET serialization)
  if (responseData && responseData.$values) {
    return responseData.$values.map(log => {
      // Ensure numeric values are properly handled with defaults
      const tempLevel = log.temperatureLevel !== undefined && log.temperatureLevel !== null 
        ? Number(log.temperatureLevel) 
        : 0;
      const waterLevel = log.waterLevel !== undefined && log.waterLevel !== null 
        ? Number(log.waterLevel) 
        : 0;
      const airLevel = log.airHumidityLevel !== undefined && log.airHumidityLevel !== null 
        ? Number(log.airHumidityLevel) 
        : 0;
      
      // Create a clean plant log object without circular references
      return {
        plantLog_ID: log.plantLog_ID,
        plant_ID: log.plant_ID,
        dato_Tid: log.dato_Tid,
        temperatureLevel: tempLevel,
        lightLevel: log.lightLevel,
        waterLevel: waterLevel,
        airHumidityLevel: airLevel,
        action: log.action || log.Action,
        plant: log.plant ? {
          plant_ID: log.plant.plant_ID,
          plant_Name: log.plant.plant_Name,
          plant_type: log.plant.plant_type
        } : null
      };
    });
  } 
  // Already an array
  else if (Array.isArray(responseData)) {
    return responseData;
  } 
  // Cannot handle this format
  else {
    console.warn('Unknown plant log data format:', responseData);
    return [];
  }
};

/**
 * Get all plant logs
 * @param {Object} params - Optional query parameters
 * @param {number} params.limit - Optional limit on number of logs returned
 * @returns {Promise} Promise with array of plant logs
 */
export const getAllPlantLogs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  
  const url = params && Object.keys(params).length > 0
    ? `${baseURL}/plantlog?${queryParams}`
    : `${baseURL}/plantlog`;
    
  return API.get(url).then(response => {
    console.log('Raw plant log data:', response.data);
    return {
      ...response,
      data: extractPlantLogs(response.data)
    };
  });
};

/**
 * Get the latest sensor readings
 * @param {number} plantId - ID of the plant
 * @returns {Promise} Promise with the latest moisture, humidity and temperature
 */
export const getLatestSensorReadings = async (plantId = 1) => {
  try {
    // Check if user has any plant logs first 
    const checkLogs = await API.get(`${baseURL}/plantlog?limit=1`);
    const hasExistingData = checkLogs.data && 
                          ((checkLogs.data.$values && checkLogs.data.$values.length > 0) ||
                           (Array.isArray(checkLogs.data) && checkLogs.data.length > 0));
    
    // If user has no data yet, return default values to avoid errors
    if (!hasExistingData) {
      console.log('No existing plant logs found for user, using default readings');
      return {
        moisture: 50,
        humidity: 45,
        temperature: 22
      };
    }
    
    // User has data, attempt to get actual readings
    try {
      const [moistureRes, humidityRes, tempRes] = await Promise.all([
        API.get(`${baseURL}/plantlog/soilmoisture/${plantId}`),
        API.get(`${baseURL}/plantlog/airhumidity/${plantId}`),
        API.get(`${baseURL}/plantlog/temperature/${plantId}`)
      ]);

      return {
        moisture: typeof moistureRes.data === 'number' ? moistureRes.data : moistureRes.data.moisture ?? 0,
        humidity: typeof humidityRes.data === 'number' ? humidityRes.data : humidityRes.data.humidity ?? 0,
        temperature: typeof tempRes.data === 'number' ? tempRes.data : tempRes.data.temperature ?? 0
      };
    } catch (error) {
      console.error('Failed to get individual sensor readings:', error);
      return {
        moisture: 50,
        humidity: 45,
        temperature: 22
      };
    }
  } catch (error) {
    console.error('Failed to get sensor readings:', error);
    return {
      moisture: 50,
      humidity: 45,
      temperature: 22
    };
  }
};

/**
 * Save a manual watering event
 * @param {Object} data - The plant log data
 * @param {number} data.plantId - ID of the plant
 * @param {number} data.moisture - Current moisture level
 * @param {number} data.humidity - Current humidity level
 * @param {number} data.temperature - Current temperature
 * @returns {Promise} Promise with the created plant log
 */
export const saveManualWateringEvent = async (data) => {
  try {
    // Make sure we have a valid plant to associate with the watering event
    let plantId = data.plantId || 1;
    
    try {
      // Check if the plant exists first
      const plantResponse = await API.get(`${baseURL}/plant`);
      if (!plantResponse.data || 
          (plantResponse.data.$values && plantResponse.data.$values.length === 0) ||
          (Array.isArray(plantResponse.data) && plantResponse.data.length === 0)) {
        // No plants found, create a default one
        console.log('Creating a default plant before logging watering event');
        const defaultPlant = {
          Plant_Name: 'My First Plant',
          Plant_Type: 'Indoor Plant',
          plant_Name: 'My First Plant',
          plant_Type: 'Indoor Plant'
        };
        
        const createResponse = await API.post(`${baseURL}/plant`, defaultPlant);
        if (createResponse.data && (createResponse.data.plant_ID || createResponse.data.Plant_ID)) {
          plantId = createResponse.data.plant_ID || createResponse.data.Plant_ID;
          console.log(`Created new plant with ID: ${plantId}`);
        }
      } else {
        // Use the first plant available
        const plants = plantResponse.data.$values || plantResponse.data;
        if (plants && plants.length > 0) {
          plantId = plants[0].plant_ID || plants[0].Plant_ID || plantId;
        }
      }
    } catch (error) {
      console.error('Error checking plants:', error);
      // Continue with the default/provided plant ID
    }
    
    // Create the event data with both camelCase and PascalCase fields for better API compatibility
    const eventData = {
      Plant_ID: plantId,
      plant_ID: plantId,
      TemperatureLevel: data.temperature || 0,
      temperatureLevel: data.temperature || 0,
      WaterLevel: data.moisture || 0,
      waterLevel: data.moisture || 0,
      AirHumidityLevel: data.humidity || 0,
      airHumidityLevel: data.humidity || 0,
      LightLevel: 1, // Use 1 as a flag for manual watering
      lightLevel: 1,
      Light_Level: 1, // Backup field
      light_Level: 1,
      Action: 'Manual Watering',
      action: 'Manual Watering'
    };
    
    console.log('Saving manual watering event with data:', eventData);
    return API.post(`${baseURL}/plantlog`, eventData);
  } catch (error) {
    console.error('Error in saveManualWateringEvent:', error);
    throw error; // Re-throw to allow handling by caller
  }
};

/**
 * Save an auto-mode toggle event
 * @param {Object} data - The plant log data
 * @param {number} data.plantId - ID of the plant
 * @param {boolean} data.isEnabled - Whether auto-mode was enabled or disabled
 * @param {number} data.moisture - Current moisture level
 * @param {number} data.humidity - Current humidity level
 * @param {number} data.temperature - Current temperature
 * @returns {Promise} Promise with the created plant log
 */
export const saveAutoModeEvent = async (data) => {
  try {
    // Make sure we have a valid plant to associate with the auto mode event
    let plantId = data.plantId || 1;
    
    try {
      // Check if the plant exists first
      const plantResponse = await API.get(`${baseURL}/plant`);
      if (!plantResponse.data || 
          (plantResponse.data.$values && plantResponse.data.$values.length === 0) ||
          (Array.isArray(plantResponse.data) && plantResponse.data.length === 0)) {
        // No plants found, create a default one
        console.log('Creating a default plant before logging auto mode event');
        const defaultPlant = {
          Plant_Name: 'My First Plant',
          Plant_Type: 'Indoor Plant',
          plant_Name: 'My First Plant',
          plant_Type: 'Indoor Plant'
        };
        
        const createResponse = await API.post(`${baseURL}/plant`, defaultPlant);
        if (createResponse.data && (createResponse.data.plant_ID || createResponse.data.Plant_ID)) {
          plantId = createResponse.data.plant_ID || createResponse.data.Plant_ID;
          console.log(`Created new plant with ID: ${plantId}`);
        }
      } else {
        // Use the first plant available
        const plants = plantResponse.data.$values || plantResponse.data;
        if (plants && plants.length > 0) {
          plantId = plants[0].plant_ID || plants[0].Plant_ID || plantId;
        }
      }
    } catch (error) {
      console.error('Error checking plants:', error);
      // Continue with the default/provided plant ID
    }
    
    // Create the event data with both camelCase and PascalCase fields for better API compatibility
    const eventData = {
      Plant_ID: plantId,
      plant_ID: plantId,
      TemperatureLevel: data.temperature || 0,
      temperatureLevel: data.temperature || 0,
      WaterLevel: data.moisture || 0,
      waterLevel: data.moisture || 0,
      AirHumidityLevel: data.humidity || 0,
      airHumidityLevel: data.humidity || 0,
      LightLevel: data.isEnabled ? 999 : 0,
      lightLevel: data.isEnabled ? 999 : 0,
      Light_Level: data.isEnabled ? 999 : 0,
      light_Level: data.isEnabled ? 999 : 0,
      Action: data.isEnabled ? 'Auto-watering Enabled' : 'Auto-watering Disabled',
      action: data.isEnabled ? 'Auto-watering Enabled' : 'Auto-watering Disabled'
    };
    
    console.log('Saving auto mode event with data:', eventData);
    return API.post(`${baseURL}/plantlog`, eventData);
  } catch (error) {
    console.error('Error in saveAutoModeEvent:', error);
    throw error; // Re-throw to allow handling by caller
  }
};

/**
 * Generates and saves initial seed data for a new user's plant
 * This is helpful to populate the dashboard with realistic data
 * @param {number} plantId - ID of the plant to generate data for
 * @returns {Promise} Promise with the created seed data
 */
export const generateInitialSensorData = async (plantId = 1) => {
  try {
    console.log('Generating initial sensor data for plant ID:', plantId);
    
    // Create an array to store our promises
    const logPromises = [];
    
    // Generate data points for the last 24 hours (one per hour)
    const now = new Date();
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      
      // Generate random but realistic values
      const temperature = Math.round((Math.random() * 10 + 20) * 10) / 10; // 20-30°C
      const moisture = Math.round(Math.random() * 70 + 30); // 30-100%
      const humidity = Math.round(Math.random() * 40 + 40); // 40-80%
      const lightLevel = Math.round(Math.random() * 800 + 200); // 200-1000
      
      // Create the log entry with both camelCase and PascalCase properties
      const logEntry = {
        Plant_ID: plantId,
        plant_ID: plantId,
        TemperatureLevel: temperature,
        temperatureLevel: temperature,
        WaterLevel: moisture,
        waterLevel: moisture,
        AirHumidityLevel: humidity,
        airHumidityLevel: humidity,
        LightLevel: lightLevel,
        lightLevel: lightLevel,
        // Use dato_Tid format that backend expects
        Dato_Tid: timestamp.toISOString(),
        dato_Tid: timestamp.toISOString()
      };
      
      // Add to our array of promises
      logPromises.push(API.post(`${baseURL}/plantlog`, logEntry));
    }
    
    // Also add a manual watering event from 8 hours ago
    const wateringTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));
    const wateringEvent = {
      Plant_ID: plantId,
      plant_ID: plantId,
      TemperatureLevel: 23,
      temperatureLevel: 23,
      WaterLevel: 90,
      waterLevel: 90,
      AirHumidityLevel: 60,
      airHumidityLevel: 60,
      LightLevel: 1,
      lightLevel: 1,
      Light_Level: 1,
      light_Level: 1,
      Dato_Tid: wateringTime.toISOString(),
      dato_Tid: wateringTime.toISOString(),
      Action: 'Manual Watering',
      action: 'Manual Watering'
    };
    logPromises.push(API.post(`${baseURL}/plantlog`, wateringEvent));
    
    // Execute all the log creation requests
    const results = await Promise.allSettled(logPromises);
    
    // Count successful operations
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Generated ${successful} sensor data points for new plant`);
    
    return { success: true, count: successful };
  } catch (error) {
    console.error('Failed to generate seed data:', error);
    return { success: false, error };
  }
};
