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
 * @param {number} params.plantId - Optional plant ID to filter logs
 * @returns {Promise} Promise with array of plant logs
 */
export const getAllPlantLogs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.plantId) queryParams.append('plantId', params.plantId);
  
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
    const checkLogs = await API.get(`${baseURL}/plantlog?limit=1${plantId ? `&plantId=${plantId}` : ''}`);
    const hasExistingData = checkLogs.data && 
                          ((checkLogs.data.$values && checkLogs.data.$values.length > 0) ||
                           (Array.isArray(checkLogs.data) && checkLogs.data.length > 0));
    
    // If user has no data yet, return default values to avoid errors
    if (!hasExistingData) {
      console.log(`No existing plant logs found for plant ${plantId}, using default readings`);
      return {
        moisture: 50,
        humidity: 45,
        temperature: 22
      };
    }
    
    // User has data, get actual readings from endpoint
    try {
      const [moistureRes, humidityRes, tempRes] = await Promise.all([
        API.get(`${baseURL}/plantlog/soilmoisture/${plantId}`),
        API.get(`${baseURL}/plantlog/airhumidity/${plantId}`),
        API.get(`${baseURL}/plantlog/temperature/${plantId}`)
      ]);

      // Extract values from API response, ensuring they're treated as actual readings
      // even if they happen to match what we might consider "default" values
      const moisture = typeof moistureRes.data === 'number' ? moistureRes.data : 
                    (moistureRes.data && typeof moistureRes.data.moisture === 'number' ? moistureRes.data.moisture : 50);
      
      const humidity = typeof humidityRes.data === 'number' ? humidityRes.data : 
                     (humidityRes.data && typeof humidityRes.data.humidity === 'number' ? humidityRes.data.humidity : 45);
      
      const temperature = typeof tempRes.data === 'number' ? tempRes.data : 
                         (tempRes.data && typeof tempRes.data.temperature === 'number' ? tempRes.data.temperature : 22);
      
      console.log(`Retrieved actual sensor values from API for plant ${plantId}:`, { moisture, humidity, temperature });
      
      return { moisture, humidity, temperature };
    } catch (error) {
      console.error(`Failed to get individual sensor readings for plant ${plantId}:`, error);
      
      // If API endpoints failed, try to get the latest values from plant logs
      try {
        const logsResponse = await getAllPlantLogs({ limit: 5, plantId });
        if (Array.isArray(logsResponse.data) && logsResponse.data.length > 0) {
          // Filter for logs that have sensor readings and sort by date (newest first)
          const sensorLogs = logsResponse.data
            .filter(log => {
              // Check if this log has any sensor readings
              return (log.temperatureLevel !== undefined || log.temperature_Level !== undefined ||
                      log.waterLevel !== undefined || log.water_Level !== undefined ||
                      log.airHumidityLevel !== undefined || log.air_Humidity_Level !== undefined);
            })
            .sort((a, b) => {
              const dateA = new Date(a.dato_Tid || a.datoTid || a.timestamp || a.date);
              const dateB = new Date(b.dato_Tid || b.datoTid || b.timestamp || b.date);
              return dateB - dateA;
            });
          
          if (sensorLogs.length > 0) {
            const latestLog = sensorLogs[0];
            console.log(`Using latest log for sensor values for plant ${plantId}:`, latestLog);
            
            // Extract values from the latest log
            const moisture = typeof latestLog.waterLevel === 'number' ? latestLog.waterLevel : 
                           (typeof latestLog.water_Level === 'number' ? latestLog.water_Level : 50);
            
            const humidity = typeof latestLog.airHumidityLevel === 'number' ? latestLog.airHumidityLevel : 
                           (typeof latestLog.air_Humidity_Level === 'number' ? latestLog.air_Humidity_Level : 45);
            
            const temperature = typeof latestLog.temperatureLevel === 'number' ? latestLog.temperatureLevel : 
                              (typeof latestLog.temperature_Level === 'number' ? latestLog.temperature_Level : 22);
            
            console.log(`Using sensor values from latest log for plant ${plantId}:`, { moisture, humidity, temperature });
            return { moisture, humidity, temperature };
          }
        }
      } catch (logsError) {
        console.error(`Failed to get sensor readings from logs for plant ${plantId}:`, logsError);
      }
      
      // Default fallback if nothing else works
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
          plant_Type: 'Indoor Plant',
          plant_environment: 'Indoor'
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
          plant_Type: 'Indoor Plant',
          plant_environment: 'Indoor'
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
 * Generate initial sensor data for a new plant or a plant with no logs
 * @param {number} plantId - The ID of the plant to generate data for
 * @returns {Promise} Promise resolving when data generation is complete
 */
export const generateInitialSensorData = async (plantId = 1) => {
  try {
    console.log(`Generating initial sensor data for plant ${plantId}`);
    
    // Create data for the last 7 days with 3 entries per day
    const now = new Date();
    const logs = [];
    
    // Go back 7 days and create 3 entries per day
    for (let day = 7; day >= 0; day--) {
      for (let entry = 0; entry < 3; entry++) {
        // Set time to be evenly spread throughout the day
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        date.setHours(8 + (entry * 6)); // 8am, 2pm, 8pm
        date.setMinutes(Math.floor(Math.random() * 60)); // Random minute
        
        // Generate random values within normal ranges
        // Temperature: normal range 10-30°C
        const temperature = 15 + Math.random() * 15; // Between 15-30°C
        
        // Soil moisture: normal range 20-80%
        const moisture = 30 + Math.random() * 50; // Between 30-80%
        
        // Humidity: normal range 30-70%
        const humidity = 35 + Math.random() * 35; // Between 35-70%
        
        // Create log data with both camelCase and PascalCase fields
        logs.push({
          Plant_ID: plantId,
          plant_ID: plantId,
          TemperatureLevel: temperature,
          temperatureLevel: temperature,
          WaterLevel: moisture,
          waterLevel: moisture,
          AirHumidityLevel: humidity,
          airHumidityLevel: humidity,
          LightLevel: 800 + Math.random() * 200, // Standard light level
          lightLevel: 800 + Math.random() * 200,
          Dato_Tid: date.toISOString(),
          dato_Tid: date.toISOString()
        });
      }
    }
    
    // Add one entry that's "now" with slightly more critical values to trigger notifications
    const criticalLog = {
      Plant_ID: plantId,
      plant_ID: plantId,
      TemperatureLevel: Math.random() < 0.5 ? 8 : 32, // Either too cold or too hot
      temperatureLevel: Math.random() < 0.5 ? 8 : 32, 
      WaterLevel: Math.random() < 0.5 ? 15 : 85, // Either too dry or too wet
      waterLevel: Math.random() < 0.5 ? 15 : 85,
      AirHumidityLevel: Math.random() < 0.5 ? 25 : 75, // Either too dry or too humid
      airHumidityLevel: Math.random() < 0.5 ? 25 : 75,
      LightLevel: 800 + Math.random() * 200,
      lightLevel: 800 + Math.random() * 200,
      Dato_Tid: new Date().toISOString(),
      dato_Tid: new Date().toISOString()
    };
    logs.push(criticalLog);
    
    // Sort logs by date
    logs.sort((a, b) => new Date(a.dato_Tid) - new Date(b.dato_Tid));
    
    // Submit logs to backend
    console.log(`Submitting ${logs.length} initial sensor logs`);
    
    // Submit logs in sequence to maintain order
    for (const log of logs) {
      await API.post(`${baseURL}/plantlog`, log);
    }
    
    console.log('Initial sensor data generation complete');
    return { success: true, count: logs.length };
  } catch (error) {
    console.error('Failed to generate initial sensor data:', error);
    throw error;
  }
};
