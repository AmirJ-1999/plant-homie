<template>
  <div class="history-container">
    <h1 class="title">🕒 Plant Activity History</h1>

    <div class="history-filters">
      <!-- Entry type filters -->
      <div class="filter-section">
        <h3 class="filter-section-title">Entry Types</h3>
        <div class="filter-options">
          <label class="filter-label">
            <input type="checkbox" id="show-sensor-logs" name="show-sensor-logs" v-model="showSensorLogs" @change="applyFilters" />
            Sensor Logs
          </label>
          <label class="filter-label">
            <input type="checkbox" id="show-notifications" name="show-notifications" v-model="showNotifications" @change="applyFilters" />
            Notifications
          </label>
          <label class="filter-label">
            <input type="checkbox" id="show-auto-water" name="show-auto-water" v-model="showAutoWaterEvents" @change="applyFilters" />
            Watering Events
          </label>
        </div>
      </div>
      
      <!-- Plant filter -->
      <div class="filter-section" v-if="plants.length > 0">
        <h3 class="filter-section-title">Plant</h3>
        <select v-model="selectedPlant" @change="applyFilters" class="plant-select">
          <option value="">All Plants</option>
          <option v-for="plant in plants" :key="plant.id" :value="plant.id">
            {{ plant.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-actions">
        <button @click="resetFilters" class="reset-button">Reset Filters</button>
      </div>
    </div>

    <div v-if="filteredHistory.length === 0" class="empty-state">
      No history available for the selected filters
    </div>
    <ul v-else class="history-list">
      <li v-for="(entry, index) in filteredHistory" :key="`history-entry-${entry.id || entry.plantLog_ID || entry.timestamp}-${index}`" 
          :class="{
            'history-item': true, 
            [entry.typeClass]: true,
            'warning-entry': entry.severity === 'Warning',
            'critical-entry': entry.severity === 'Critical',
            'normal-entry': (entry.type === 'auto-water' || entry.type === 'manual-water')
          }">
        <div class="entry-header">
          <span class="timestamp">{{ formatDate(entry.timestamp) }}</span>
          <div class="entry-badges">
            <span class="entry-type" :class="getTypeClass(entry)">{{ entry.typeLabel }}</span>
            <span v-if="entry.severity === 'Critical'" class="severity critical">Critical state</span>
            <span v-else-if="entry.severity === 'Warning'" class="severity warning">Needs attention</span>
          </div>
        </div>
        <div class="entry-content">
          <div class="entry-icon">{{ entry.icon }}</div>
          <div class="entry-details">
            <div class="entry-message">{{ entry.message }}</div>
            <div v-if="entry.plantName" class="entry-plant">{{ entry.plantName }}</div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { getAllNotifications } from '@/services/NotificationService';
import { getAllPlantLogs } from '@/services/PlantLogService';
import { API } from '@/services/api';

export default {
  name: 'HistoryView',
  data() {
    return {
      plantLogs: [],
      notifications: [],
      plants: [],
      // Entry type filters
      showSensorLogs: true,
      showNotifications: true,
      showAutoWaterEvents: true,
      // Plant filter
      selectedPlant: '',
      // Filtered results
      filteredHistory: [],
      refreshInterval: null
    };
  },
  async mounted() {
    // Fetch initial data
    await Promise.all([
      this.fetchPlantLogs(),
      this.fetchNotifications(),
      this.fetchPlants()
    ]);
    
    // Apply filters from URL if present
    this.applyUrlFilters();
    
    // Then apply all filters
    this.applyFilters();
    
    // Set up auto-refresh every 30 seconds
    this.refreshInterval = setInterval(async () => {
      await Promise.all([
        this.fetchPlantLogs(),
        this.fetchNotifications()
      ]);
      this.applyFilters();
    }, 30000);
  },
  beforeUnmount() {
    // Clear the interval when component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString();
    },
    
    getTypeClass(entry) {
      if (entry.type === 'notification') {
        if (entry.severity === 'Critical') return 'critical-type';
        if (entry.severity === 'Warning') return 'warning-type';
        return 'notification-type';
      }
      return '';
    },
    
    applyUrlFilters() {
      // Check URL for filter parameters
      const query = this.$route.query;
      
      // Plant filter
      if (query.plant) {
        this.selectedPlant = query.plant;
      }
    },
    
    resetFilters() {
      this.showSensorLogs = true;
      this.showNotifications = true;
      this.showAutoWaterEvents = true;
      this.selectedPlant = '';
      this.applyFilters();
      
      // Clear URL parameters and update history
      this.$router.replace({ path: '/history', query: {} });
    },
    
    async fetchPlants() {
      try {
        const response = await API.get('/plant');
        if (response.data) {
          let plantList = [];
          
          // Handle response structure variations
          if (response.data.$values && Array.isArray(response.data.$values)) {
            plantList = response.data.$values;
          } else if (Array.isArray(response.data)) {
            plantList = response.data;
          }
          
          // Format plants data
          this.plants = plantList.map(plant => ({
            id: plant.plant_ID || plant.Plant_ID,
            name: plant.plant_Name || plant.Plant_Name || 'Unknown plant'
          }));
        }
      } catch (error) {
        console.error('Error fetching plants:', error);
      }
    },
    
    async fetchPlantLogs() {
      try {
        const res = await getAllPlantLogs();
        if (Array.isArray(res.data)) {
          this.plantLogs = res.data.map(log => {
            // Handle field name variations
            const id = log.plantLog_ID || log.plantLogId || log.id;
            const timestamp = new Date(log.dato_Tid || log.datoTid || log.timestamp || log.date);
            const plantId = log.plant_ID || log.Plant_ID || (log.plant ? (log.plant.plant_ID || log.plant.Plant_ID) : null);
            
            // Ensure temperature, moisture and humidity have valid numeric values
            const temperature = typeof log.temperatureLevel === 'number' ? log.temperatureLevel : 
                              (typeof log.temperature_Level === 'number' ? log.temperature_Level : 0);
            
            const moisture = typeof log.waterLevel === 'number' ? log.waterLevel : 
                            (typeof log.water_Level === 'number' ? log.water_Level : 0);
            
            const humidity = typeof log.airHumidityLevel === 'number' ? log.airHumidityLevel : 
                            (typeof log.air_Humidity_Level === 'number' ? log.air_Humidity_Level : 0);
                            
            const lightLevel = log.lightLevel !== undefined ? log.lightLevel : log.light_Level;
            const plantName = log.plant?.plant_Name || log.plantName || 'Unknown plant';
            const action = log.action || log.Action;
            
            // Check if this is an auto-watering event
            if (lightLevel === 999 || lightLevel === 0) {
              const isEnabled = lightLevel === 999;
              return {
                id,
                timestamp,
                plantId,
                type: 'auto-water',
                typeLabel: 'Auto Watering',
                typeClass: 'auto-water-entry',
                icon: '🤖',
                message: isEnabled ? 'Auto-watering mode enabled' : 'Auto-watering mode disabled',
                plantName
              };
            } 
            // Check if this is a manual watering event
            else if (lightLevel === 1 || action === 'Manual Watering') {
              return {
                id,
                timestamp,
                plantId,
                type: 'manual-water',
                typeLabel: 'Manual Watering',
                typeClass: 'manual-water-entry',
                icon: '💧',
                message: 'Plant watered manually',
                plantName
              };
            }
            // Regular sensor log
            else {
              // Analyze sensor values and generate status messages
              let statusMessage = '';
              let severity = null;
              
              // Check temperature
              if (temperature < 5) {
                statusMessage = `Temperature is critically low (${temperature.toFixed(1)}°C)! Move to a warmer location immediately.`;
                severity = 'Critical';
              } else if (temperature < 10) {
                statusMessage = `Temperature is low (${temperature.toFixed(1)}°C). Consider moving to a warmer spot.`;
                severity = 'Warning';
              } else if (temperature > 35) {
                statusMessage = `Temperature is critically high (${temperature.toFixed(1)}°C)! Move away from heat sources immediately.`;
                severity = 'Critical';
              } else if (temperature > 30) {
                statusMessage = `Temperature is high (${temperature.toFixed(1)}°C). Consider moving to a cooler spot.`;
                severity = 'Warning';
              }
              
              // Check moisture
              if (moisture < 10) {
                statusMessage = statusMessage || `Soil is critically dry (${moisture.toFixed(1)}%)! Water immediately.`;
                severity = severity || 'Critical';
              } else if (moisture < 20) {
                statusMessage = statusMessage || `Soil is dry (${moisture.toFixed(1)}%). Plant needs water soon.`;
                severity = severity || 'Warning';
              } else if (moisture > 90) {
                statusMessage = statusMessage || `Soil is critically wet (${moisture.toFixed(1)}%)! Reduce watering immediately.`;
                severity = severity || 'Critical';
              } else if (moisture > 80) {
                statusMessage = statusMessage || `Soil is quite wet (${moisture.toFixed(1)}%). Consider reducing watering.`;
                severity = severity || 'Warning';
              }
              
              // Check humidity
              if (humidity < 20) {
                statusMessage = statusMessage || `Air humidity is critically low (${humidity.toFixed(1)}%)! Consider using a humidifier.`;
                severity = severity || 'Critical';
              } else if (humidity < 30) {
                statusMessage = statusMessage || `Air humidity is low (${humidity.toFixed(1)}%). Consider misting the plant.`;
                severity = severity || 'Warning';
              } else if (humidity > 80) {
                statusMessage = statusMessage || `Air humidity is very high (${humidity.toFixed(1)}%). Improve air circulation.`;
                severity = severity || 'Warning';
              } else if (humidity > 90) {
                statusMessage = statusMessage || `Air humidity is critically high (${humidity.toFixed(1)}%)! Risk of fungal disease.`;
                severity = severity || 'Critical';
              }
              
              // If no issues found, create a normal reading
              if (!statusMessage) {
                statusMessage = `Temperature: ${temperature.toFixed(1)}°C, Moisture: ${moisture.toFixed(1)}%, Humidity: ${humidity.toFixed(1)}%`;
              } else {
                // If there was a status message, still include the readings
                statusMessage = `${statusMessage} (Temperature: ${temperature.toFixed(1)}°C, Moisture: ${moisture.toFixed(1)}%, Humidity: ${humidity.toFixed(1)}%)`;
              }
              
              return {
                id,
                timestamp,
                plantId,
                type: 'sensor',
                typeLabel: 'Sensor Reading',
                typeClass: 'sensor-entry',
                icon: '📊',
                message: statusMessage,
                plantName,
                severity: severity
              };
            }
          });
        }
      } catch (err) {
        console.error('Could not fetch plant logs:', err);
        
        // Don't override existing data if the request fails
        if (this.plantLogs.length === 0) {
          // Add fallback/mock data for better user experience during API issues
          if (process.env.NODE_ENV !== 'production') {
            this.plantLogs = [
              {
                id: 'mock-1',
                timestamp: new Date(),
                type: 'sensor',
                typeLabel: 'Sensor Reading',
                typeClass: 'sensor-entry',
                icon: '📊',
                message: 'Temperature: 22.5°C, Moisture: 65.0%, Humidity: 48.0%',
                plantName: 'Demo Plant'
              },
              {
                id: 'mock-2',
                timestamp: new Date(Date.now() - 3600000),
                type: 'auto-water',
                typeLabel: 'Auto Watering',
                typeClass: 'auto-water-entry',
                icon: '🤖',
                message: 'Auto-watering mode enabled',
                plantName: 'Demo Plant'
              }
            ];
          }
        }
      }
    },
    
    async fetchNotifications() {
      try {
        const response = await getAllNotifications();
        if (response.data && Array.isArray(response.data)) {
          this.notifications = response.data.map(notification => {
            // Get appropriate icon based on notification type
            let icon = '🔔';
            let notificationType = notification.type || notification.Type || '';
            let severity = notification.notificationType || notification.NotificationType || '';
            
            // Extract plant ID
            const plantId = notification.plant_ID || notification.Plant_ID || 
                           (notification.plant ? (notification.plant.plant_ID || notification.plant.Plant_ID) : null);
            
            // Determine notification type from message if not explicitly stated
            if (!notificationType) {
              if (notification.message?.includes('moisture') || notification.message?.includes('soil')) {
                notificationType = 'Water';
              } else if (notification.message?.includes('humidity')) {
                notificationType = 'Humidity';
              } else if (notification.message?.includes('temperature')) {
                notificationType = 'Temperature';
              }
            }
            
            // Determine severity from message if not explicitly stated
            if (!severity) {
              if (notification.message?.includes('Critical')) {
                severity = 'Critical';
              } else if (notification.message?.includes('Warning')) {
                severity = 'Warning';
              } else if (notificationType === 'Temperature' || notificationType === 'Humidity' || notificationType === 'Water') {
                // If it's a sensor notification without explicit severity, default to Warning
                severity = 'Warning';
              }
            }
            
            // Assign icon based on type
            if (notificationType === 'Water' || notificationType === 'Moisture') icon = '💧';
            else if (notificationType === 'Humidity') icon = '💨';
            else if (notificationType === 'Temperature') icon = '🌡️';
            
            return {
              id: notification.notification_ID,
              timestamp: new Date(notification.dato_Tid),
              plantId,
              type: 'notification',
              notificationType,
              severity,
              typeLabel: 'Notification',
              typeClass: 'notification-entry',
              icon,
              message: notification.message || 'System notification',
              plantName: notification.plant?.plant_Name || 'Unknown plant'
            };
          });
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
    },
    
    applyFilters() {
      // Combine and filter history based on user preferences
      let combinedHistory = [];
      
      // Filter by entry type
      if (this.showSensorLogs) {
        combinedHistory.push(...this.plantLogs.filter(log => log.type === 'sensor'));
      }
      
      if (this.showNotifications) {
        combinedHistory.push(...this.notifications);
      }
      
      if (this.showAutoWaterEvents) {
        combinedHistory.push(...this.plantLogs.filter(log => log.type === 'auto-water' || log.type === 'manual-water'));
      }
      
      // Filter by plant if selected
      if (this.selectedPlant) {
        combinedHistory = combinedHistory.filter(entry => 
          entry.plantId === this.selectedPlant || entry.plantId === Number(this.selectedPlant)
        );
      }
      
      // Sort by timestamp, newest first
      this.filteredHistory = combinedHistory.sort((a, b) => b.timestamp - a.timestamp);
    }
  }
};
</script>

<style scoped>
.history-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #166534;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.history-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-section-title {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  font-weight: 600;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.8rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
  color: #4b5563;
  transition: all 0.2s;
}

.filter-label:hover {
  background: #f3f4f6;
}

.plant-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
  font-size: 0.9rem;
  color: #4b5563;
  max-width: 300px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.reset-button {
  background-color: #e5e7eb;
  color: #4b5563;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: #d1d5db;
}

.empty-state {
  padding: 4rem 0;
  text-align: center;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  padding: 1.2rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.history-item:hover {
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

/* Colored borders for different notification severities */
.history-item.warning-entry {
  border-left: 4px solid #ffcc00;
}

.history-item.critical-entry {
  border-left: 4px solid #ff4757;
}

.history-item.normal-entry {
  border-left: 4px solid #22c55e;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #f3f4f6;
}

.entry-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.timestamp {
  color: #6b7280;
  font-size: 0.9rem;
}

.entry-type {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.entry-type.warning-type {
  background-color: #fff8e1;
  color: #ff8f00;
}

.entry-type.critical-type {
  background-color: #ffebee;
  color: #d32f2f;
}

.severity {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.severity.critical {
  background-color: #ffebee;
  color: #d32f2f;
}

.severity.warning {
  background-color: #fff8e1;
  color: #ff8f00;
}

.entry-content {
  display: flex;
  align-items: flex-start;
}

.entry-icon {
  font-size: 1.5rem;
  margin-right: 1.2rem;
  flex-shrink: 0;
}

.entry-details {
  flex: 1;
}

.entry-message {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.3rem;
}

.entry-plant {
  font-size: 0.9rem;
  color: #6b7280;
}

/* Entry type specific styles */
.sensor-entry .entry-type {
  background-color: #dbeafe;
  color: #1e40af;
}

.notification-entry .entry-type.notification-type {
  background-color: #f3f4f6;
  color: #4b5563;
}

.auto-water-entry .entry-type,
.manual-water-entry .entry-type {
  background-color: #d1fae5;
  color: #047857;
}

@media (max-width: 768px) {
  .history-container {
    padding: 1.5rem;
    padding-top: 4rem; /* Add space for fixed navbar */
  }
  
  .title {
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  
  .filter-options {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .plant-select {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .history-container {
    padding: 1rem;
    padding-top: 4rem; /* Keep space for fixed navbar */
  }
  
  .title {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    display: block;
    text-align: center;
  }
  
  .history-filters {
    padding: 0.8rem;
  }
  
  .filter-section-title {
    margin-bottom: 0.2rem;
  }
  
  .filter-label {
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
    width: 100%;
  }
  
  .history-item {
    padding: 1rem;
  }
  
  .entry-badges {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
  }
  
  .entry-icon {
    font-size: 1.3rem;
    margin-right: 0.8rem;
  }
  
  .entry-message {
    font-size: 0.9rem;
  }
}
</style>