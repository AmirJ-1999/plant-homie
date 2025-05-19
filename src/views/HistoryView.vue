<template>
  <div class="history-container">
    <h1 class="title">🕒 Plant Activity History</h1>

    <div class="history-filters">
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
        Auto-water Events
      </label>
    </div>

    <div v-if="filteredHistory.length === 0" class="empty-state">
      No history available
    </div>
    <ul v-else class="history-list">
      <li v-for="entry in filteredHistory" :key="entry.id" :class="{'history-item': true, [entry.typeClass]: true}">
        <div class="entry-header">
          <span class="timestamp">{{ formatDate(entry.timestamp) }}</span>
          <span class="entry-type">{{ entry.typeLabel }}</span>
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

export default {
  name: 'HistoryView',
  data() {
    return {
      plantLogs: [],
      notifications: [],
      showSensorLogs: true,
      showNotifications: true,
      showAutoWaterEvents: true,
      filteredHistory: [],
      refreshInterval: null
    };
  },
  async mounted() {
    await Promise.all([
      this.fetchPlantLogs(),
      this.fetchNotifications()
    ]);
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
    async fetchPlantLogs() {
      try {
        const res = await getAllPlantLogs();
        if (Array.isArray(res.data)) {
          this.plantLogs = res.data.map(log => {
            // Handle field name variations
            const id = log.plantLog_ID || log.plantLogId || log.id;
            const timestamp = new Date(log.dato_Tid || log.datoTid || log.timestamp || log.date);
            
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
              return {
                id,
                timestamp,
                type: 'sensor',
                typeLabel: 'Sensor Reading',
                typeClass: 'sensor-entry',
                icon: '📊',
                message: `Temperature: ${temperature.toFixed(1)}°C, Moisture: ${moisture.toFixed(1)}%, Humidity: ${humidity.toFixed(1)}%`,
                plantName
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
            // Hent passende ikon baseret på notifikationstype
            let icon = '🔔';
            if (notification.type === 'Water') icon = '💧';
            else if (notification.type === 'Humidity') icon = '💨';
            else if (notification.type === 'Temperature') icon = '🌡️';
            
            return {
              id: notification.notification_ID,
              timestamp: new Date(notification.dato_Tid),
              type: 'notification',
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
      // Kombiner og filtrer historik baseret på brugerpræferencer
      const combinedHistory = [];
      
      if (this.showSensorLogs) {
        combinedHistory.push(...this.plantLogs.filter(log => log.type === 'sensor'));
      }
      
      if (this.showNotifications) {
        combinedHistory.push(...this.notifications);
      }
      
      if (this.showAutoWaterEvents) {
        combinedHistory.push(...this.plantLogs.filter(log => log.type === 'auto-water'));
      }
      
      // Sorter efter tidsstempel, nyeste først
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
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
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

.entry-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #f3f4f6;
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

.notification-entry .entry-type {
  background-color: #fee2e2;
  color: #b91c1c;
}

.auto-water-entry .entry-type {
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
  
  .filter-controls {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .event-list {
    margin-top: 1.5rem;
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
  
  .filter-controls {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .filter-toggle {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
    width: 100%;
    max-width: 300px;
  }
  
  .event-item {
    padding: 1rem;
  }
  
  .event-header {
    margin-bottom: 0.5rem;
  }
  
  .event-timestamp {
    font-size: 0.85rem;
  }
  
  .event-content {
    font-size: 0.9rem;
  }
}
</style>