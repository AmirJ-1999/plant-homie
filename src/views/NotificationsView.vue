<template>
    <div class="notifications-container">
      <h1 class="title">🔔 Notifications</h1>
  
      <div class="card settings-card">
        <h2>Notification Settings</h2>
        <label class="checkbox-label">
          <input type="checkbox" id="notifications-toggle" name="notifications-enabled" v-model="notificationsEnabled" @change="saveNotificationPreferences" />
          Enable Notifications
        </label>
  
        <div v-if="notificationsEnabled" class="thresholds">
          <div class="threshold-input">
            <label>
              Humidity Alert Threshold (%):
              <input type="number" id="humidity-threshold" name="humidity-threshold" v-model.number="humidityThreshold" @change="saveNotificationPreferences" />
            </label>
            <div class="safe-range">Normal range: 30-70%. Critical if below 20% or above 80%</div>
          </div>
          <div class="threshold-input">
            <label>
              Moisture Alert Threshold (%):
              <input type="number" id="moisture-threshold" name="moisture-threshold" v-model.number="moistureThreshold" @change="saveNotificationPreferences" />
            </label>
            <div class="safe-range">Normal range: 20-80%. Critical if below 10% or above 90%</div>
          </div>
          <div class="threshold-input">
            <label>
              Temperature Alert Threshold (°C):
              <input type="number" id="temperature-threshold" name="temperature-threshold" v-model.number="temperatureThreshold" @change="saveNotificationPreferences" />
            </label>
            <div class="safe-range">Normal range: 10-30°C. Critical if below 5°C or above 35°C</div>
          </div>
        </div>
        
        <div class="test-notification">
          <h3>Test Notification</h3>
          <div class="test-controls">
            <select v-if="plants.length > 0" v-model="selectedPlantId" class="plant-select">
              <option v-for="plant in plants" :key="plant.id" :value="plant.id">{{ plant.name }}</option>
            </select>
            <select v-else disabled class="plant-select">
              <option>No plants available</option>
            </select>

            <select v-model="testNotificationType" id="notification-type" name="notification-type" class="notification-type-select">
              <option value="Moisture">Moisture</option>
              <option value="Humidity">Humidity</option>
              <option value="Temperature">Temperature</option>
            </select>
            <select v-model="testSeverity" id="severity-type" name="severity-type" class="notification-type-select">
              <option value="Warning">Needs Attention</option>
              <option value="Critical">Critical State</option>
            </select>
            <button @click="createTestNotification" class="test-button">Create Test Notification</button>
          </div>
          <div v-if="testMessage" class="test-message" :class="{ success: testSuccess, error: !testSuccess }">
            {{ testMessage }}
          </div>
          
          <!-- Add direct test button for simplified testing -->
          <div class="direct-test mt-3">
            <h4>Direct API Test</h4>
            <p>Use this option to test the notification API directly with minimal data:</p>
            <TestNotificationButton :plantId="selectedPlantId || 1" />
          </div>
        </div>
      </div>
  
      <div class="card">
        <h2>Recent Notifications</h2>
        <div v-if="notifications.length === 0" class="empty-state">
          No notifications yet
        </div>
        <div v-else>
          <div class="notification-header-actions">
            <button class="mark-all-button" @click="markAllAsRead" v-if="notifications.some(n => !n.isRead)">
              Mark all as read
            </button>
          </div>
          <ul class="notification-list">
            <li 
              v-for="notification in notifications" 
              :key="notification.notification_ID" 
              class="notification-item" 
              :class="{ 
                'unread': !notification.isRead, 
                'warning-entry': isSeverity(notification, 'Warning'),
                'critical-entry': isSeverity(notification, 'Critical'),
                'normal-entry': (notification.type === 'Auto-water' || notification.type === 'Manual-water')
              }"
            >
              <div class="notification-header">
            <div class="notification-time">{{ formatDate(notification.dato_Tid) }}</div>
                <div class="notification-badges">
                  <span class="sensor-reading-badge" v-if="notification.type === 'Moisture' || notification.type === 'Humidity' || notification.type === 'Temperature'">SENSOR READING</span>
                  <span v-if="isSeverity(notification, 'Critical')" class="critical-badge">Critical state</span>
                  <span v-else-if="isSeverity(notification, 'Warning')" class="warning-badge">Needs attention</span>
                </div>
              </div>
            <div class="notification-content">
              <div class="notification-icon">
                  <span v-if="notification.type === 'Moisture'">💧</span>
                <span v-else-if="notification.type === 'Humidity'">💨</span>
                <span v-else-if="notification.type === 'Temperature'">🌡️</span>
                  <span v-else-if="notification.type === 'Auto-water' || notification.type === 'Manual-water'">🌱</span>
                <span v-else>🔔</span>
              </div>
              <div class="notification-text">
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-plant">{{ notification.plant?.plant_Name || 'Unknown plant' }}</div>
                  <div v-if="hasSensorValues(notification)" class="notification-sensor-readings">
                    <span class="reading-label">Current values:</span>
                    <span v-if="extractValue(notification, 'temp')" class="reading-value">
                      🌡️ {{ extractValue(notification, 'temp') }}°C
                    </span>
                    <span v-if="extractValue(notification, 'soil')" class="reading-value">
                      💧 {{ extractValue(notification, 'soil') }}%
                    </span>
                    <span v-if="extractValue(notification, 'humidity')" class="reading-value">
                      💨 {{ extractValue(notification, 'humidity') }}%
                    </span>
                  </div>
              </div>
            </div>
          </li>
        </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { getAllNotifications, createNotification, markAllAsRead } from '@/services/NotificationService';
  import { getLatestSensorReadings } from '@/services/PlantLogService';
  import { API } from '@/services/api';
  import TestNotificationButton from '@/components/TestNotificationButton.vue';
  
  export default {
    name: 'NotificationsView',
    components: {
      TestNotificationButton
    },
    data() {
      return {
        notificationsEnabled: true,
        humidityThreshold: 30,
        moistureThreshold: 20,
        temperatureThreshold: 15,
        notifications: [],
        testNotificationType: 'Moisture',
        testSeverity: 'Warning',
        testMessage: '',
        testSuccess: false,
        refreshInterval: null,
        notificationType: 'Warning',
        plants: [],
        selectedPlantId: null
      };
    },
    async mounted() {
      // Load saved preferences from localStorage
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.notificationsEnabled = settings.enabled;
        this.humidityThreshold = settings.humidityThreshold;
        this.moistureThreshold = settings.moistureThreshold;
        this.temperatureThreshold = settings.temperatureThreshold;
      }
      
      // Load available plants
      await this.fetchPlants();
      
      // Load notifications from backend
      await this.loadNotifications();
      
      // Check latest sensor readings and create notifications if needed
      if (this.notificationsEnabled) {
        await this.checkSensorReadingsForAlerts();
      }
      
      // Set up auto-refresh every 30 seconds
      this.refreshInterval = setInterval(async () => {
        await this.loadNotifications();
        
        // Also check sensor readings during each refresh
        if (this.notificationsEnabled) {
          await this.checkSensorReadingsForAlerts();
        }
      }, 30000);
    },
    beforeUnmount() {
      // Clear the interval when component is destroyed
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    },
    methods: {
      isSeverity(notification, severity) {
        // Check multiple possible locations of severity information
        return (notification.notificationType === severity) || 
               (notification.NotificationType === severity) ||
               (notification.message && notification.message.includes(severity)) ||
               (notification.type === severity);
      },
      hasSensorValues(notification) {
        // Check if the notification message contains any sensor values
        return this.extractValue(notification, 'temp') !== null || 
              this.extractValue(notification, 'soil') !== null || 
              this.extractValue(notification, 'humidity') !== null;
      },
      extractValue(notification, type) {
        if (!notification.message) return null;
        
        let regex;
        switch(type) {
          case 'temp':
            regex = /temperature\s*\((\d+(\.\d+)?)\s*°C\)/i;
            break;
          case 'soil':
            regex = /soil\s*\((\d+(\.\d+)?)\s*%\)/i;
            break;
          case 'humidity':
            regex = /humidity\s*\((\d+(\.\d+)?)\s*%\)/i;
            break;
          default:
            return null;
        }
        
        const match = notification.message.match(regex);
        return match ? match[1] : null;
      },
      formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString();
      },
      async loadNotifications() {
        try {
          const response = await getAllNotifications();
          if (response.data && Array.isArray(response.data)) {
            // Sort notifications by date (newest first)
            const sortedNotifications = [...response.data].sort((a, b) => {
              const dateA = new Date(a.dato_Tid || a.timestamp);
              const dateB = new Date(b.dato_Tid || b.timestamp);
              return dateB - dateA;
            });
            
            // Process notifications to ensure they have severity and type information
            this.notifications = sortedNotifications.map(notification => {
              // Determine notification type from message if not already set
              if (!notification.type) {
                if (notification.message?.toLowerCase().includes('moisture') || 
                    notification.message?.toLowerCase().includes('soil')) {
                  notification.type = 'Moisture';
                } else if (notification.message?.toLowerCase().includes('humidity')) {
                  notification.type = 'Humidity';
                } else if (notification.message?.toLowerCase().includes('temperature')) {
                  notification.type = 'Temperature';
                } else if (notification.message?.toLowerCase().includes('auto-watering')) {
                  notification.type = 'Auto-water';
                } else if (notification.message?.toLowerCase().includes('watered manually')) {
                  notification.type = 'Manual-water';
                }
              }
              
              // Convert any "Water" type to "Moisture" for consistency
              if (notification.type === 'Water') {
                notification.type = 'Moisture';
              }

              // Extract severity from the message if not already set
              if (!notification.notificationType) {
                if (notification.message && notification.message.toLowerCase().includes('critical')) {
                  notification.notificationType = 'Critical';
                } else if (notification.message && notification.message.toLowerCase().includes('warning')) {
                  notification.notificationType = 'Warning';
                } else if (notification.type === 'Temperature' || notification.type === 'Humidity' || notification.type === 'Moisture') {
                  // Check for critical keywords in the message
                  if ((notification.message?.toLowerCase().includes('critically')) || 
                      (notification.message?.toLowerCase().includes('immediately')) ||
                      (notification.message?.toLowerCase().includes('dangerously'))) {
                    notification.notificationType = 'Critical';
                  } else {
                    // Sensor-related notifications that don't specify severity default to Warning
                    notification.notificationType = 'Warning';
                  }
                }
              }
              
              return notification;
            });
          }
        } catch (error) {
          console.error('Error loading notifications:', error);
          
          // Don't override existing data if the request fails
          if (this.notifications.length === 0) {
            // Add demo notifications for better UX during API issues
            if (process.env.NODE_ENV !== 'production') {
              this.notifications = [
                {
                  notification_ID: 'mock-1',
                  dato_Tid: new Date(),
                  type: 'Moisture',
                  notificationType: 'Warning',
                  message: 'Your plant needs attention! Soil moisture is at 15%, which is below the normal range (20-80%).',
                  plant: { plant_Name: 'Demo Plant' }
                },
                {
                  notification_ID: 'mock-2',
                  dato_Tid: new Date(Date.now() - 3600000),
                  type: 'Humidity',
                  notificationType: 'Critical',
                  message: 'Critical: Humidity level is extremely low (15%) - well below the normal range (30-70%).',
                  plant: { plant_Name: 'Demo Plant' }
                },
                {
                  notification_ID: 'mock-3',
                  dato_Tid: new Date(Date.now() - 7200000),
                  type: 'Auto-water',
                  message: 'Auto-watering mode has been enabled for your plant.',
                  plant: { plant_Name: 'Demo Plant' }
                }
              ];
            }
          }
        }
      },
      saveNotificationPreferences() {
        // Gem notifikationspræferencer i localStorage
        const settings = {
          enabled: this.notificationsEnabled,
          humidityThreshold: this.humidityThreshold,
          moistureThreshold: this.moistureThreshold,
          temperatureThreshold: this.temperatureThreshold
        };
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
      },
      async fetchPlants() {
          try {
          const response = await API.get('/plant');
          if (response.data) {
            let plantData = [];
            
            if (response.data.$values && Array.isArray(response.data.$values)) {
              plantData = response.data.$values;
            } else if (Array.isArray(response.data)) {
              plantData = response.data;
            }
            
            this.plants = plantData.map(plant => ({
              id: plant.plant_ID || plant.Plant_ID,
              name: plant.plant_Name || plant.Plant_Name || 'Unknown plant'
            }));
            
            if (this.plants.length > 0) {
              this.selectedPlantId = this.plants[0].id;
            }
          }
        } catch (error) {
          console.error('Error fetching plants:', error);
          // Create a default plant if no plants are available
          await this.createDefaultPlant();
        }
      },
      
      async createDefaultPlant() {
        try {
              console.log('No plants found, creating default plant');
              const defaultPlant = {
                Plant_Name: 'My First Plant',
                Plant_Type: 'Indoor Plant',
                plant_Name: 'My First Plant', 
                plant_Type: 'Indoor Plant',
                plant_environment: 'Indoor'
              };
              
              const createResponse = await API.post('/plant', defaultPlant);
          if (createResponse.data) {
            const plantId = createResponse.data.plant_ID || createResponse.data.Plant_ID;
            this.plants = [{
              id: plantId,
              name: 'My First Plant'
            }];
            this.selectedPlantId = plantId;
                console.log(`Created new plant with ID: ${plantId}`);
            }
          } catch (error) {
          console.error('Error creating default plant:', error);
        }
      },

      async createTestNotification() {
        this.testMessage = 'Creating notification...';
        
        try {
          // Use the selected plant ID if available, otherwise try to use the first plant
          let plantId = this.selectedPlantId;
          let plantName = '';
          
          // Find the plant name for the selected plant
          if (this.selectedPlantId && this.plants.length > 0) {
            const plant = this.plants.find(p => p.id === this.selectedPlantId);
            if (plant) {
              plantName = plant.name;
            }
          }
          
          // If no plant is selected or found, create a default one
          if (!plantId) {
            if (this.plants.length === 0) {
              await this.createDefaultPlant();
              if (this.plants.length > 0) {
                plantId = this.plants[0].id;
                plantName = this.plants[0].name;
              } else {
                plantId = 1;
                plantName = 'Default Plant';
              }
            } else {
              plantId = this.plants[0].id;
              plantName = this.plants[0].name;
            }
          }
          
          // Generate message based on notification type and severity
          let message;
          // Set notificationType based on testSeverity
          this.notificationType = this.testSeverity;
          
          // Convert Water to Moisture for consistency
          let notificationType = this.testNotificationType;
          if (notificationType === 'Water') {
            notificationType = 'Moisture';
          }
          
          // Generate sensor values for test notification
          const moistureValue = this.testSeverity === 'Critical' ? 8 : 18;
          const humidityValue = this.testSeverity === 'Critical' ? 15 : 25;
          const temperatureValue = this.testSeverity === 'Critical' ? 3 : 8;
          
          if (this.testSeverity === 'Critical') {
            switch(notificationType) {
              case 'Moisture':
                message = `Critical: ${plantName} is severely dehydrated! Soil moisture is at ${moistureValue}%, which is dangerously below the normal range (20-80%). Water immediately to prevent permanent damage. (Temperature: 22.5°C, Moisture: ${moistureValue}%, Humidity: 45%)`;
                break;
              case 'Humidity':
                message = `Critical: Humidity level around ${plantName} is at ${humidityValue}%, which is extremely low. Use a humidifier immediately or move to a more humid environment. (Temperature: 24.0°C, Moisture: 45%, Humidity: ${humidityValue}%)`;
                break;
              case 'Temperature':
                message = `Critical: Temperature around ${plantName} is at ${temperatureValue}°C, which is dangerously low. Move to a much warmer location immediately to prevent frost damage. (Temperature: ${temperatureValue}°C, Moisture: 55%, Humidity: 40%)`;
                break;
              default:
                message = `Critical system notification for ${plantName}`;
            }
          } else {
            switch(notificationType) {
              case 'Moisture':
                message = `Warning: ${plantName} needs attention! Soil moisture is at ${moistureValue}%, which is below the normal range (20-80%). Water your plant soon. (Temperature: 22.5°C, Moisture: ${moistureValue}%, Humidity: 45%)`;
              break;
            case 'Humidity':
                message = `Warning: Humidity level around ${plantName} is at ${humidityValue}%, which is below the normal range (30-70%). Consider misting your plant or using a humidifier. (Temperature: 24.0°C, Moisture: 45%, Humidity: ${humidityValue}%)`;
              break;
            case 'Temperature':
                message = `Warning: Temperature around ${plantName} is at ${temperatureValue}°C, which is below the optimal range. Consider moving to a warmer location. (Temperature: ${temperatureValue}°C, Moisture: 55%, Humidity: 40%)`;
              break;
            default:
                message = `Warning system notification for ${plantName}`;
            }
          }
          
          // Create notification object with both camelCase and PascalCase properties
          // to ensure compatibility with the backend API
          const notification = {
            Plant_ID: plantId,
            Message: message,
            Type: notificationType,
            plant_Type: notificationType,
            message: message, // Add lowercase version
            plant_ID: plantId, // Add lowercase version
            type: notificationType, // Add lowercase version
            NotificationType: this.notificationType,
            notificationType: this.notificationType,
            User_ID: parseInt(sessionStorage.getItem('userId')) || null // Include user ID
          };
          
          console.log('Sending notification:', notification);
          
          // Send to backend
          const response = await createNotification(notification);
          console.log('Notification created:', response);
          
          // Update notification list
          await this.loadNotifications();
          
          this.testMessage = 'Notification created successfully!';
          this.testSuccess = true;
          
          // Clear message after 3 seconds
          setTimeout(() => {
            this.testMessage = '';
          }, 3000);
        } catch (error) {
          console.error('Error creating notification:', error);
          this.testMessage = `Error: ${error.response?.data?.message || error.response?.data || 'Could not create notification'}`;
          this.testSuccess = false;
          
          // Don't clear error message automatically
        }
      },
      async checkSensorReadingsForAlerts() {
        try {
          const readings = await getLatestSensorReadings();
          if (readings && readings.data && readings.data.length > 0) {
            // Loop through all plants
            for (const reading of readings.data) {
              if (!reading.plant) continue;
              
              const plantName = reading.plant.plant_Name || 'your plant';
              
              // Check moisture levels (water)
              if (reading.waterLevel !== undefined) {
                // Water level below threshold (too dry)
                if (reading.waterLevel < this.moistureThreshold) {
                  await this.createNotificationIfNeeded({
                    Plant_ID: reading.plant.plant_ID,
                    Type: 'Moisture',
                    Message: `${plantName} is too dry! Soil moisture at ${reading.waterLevel.toFixed(1)}%. Please water your plant soon.`,
                    NotificationType: reading.waterLevel < 10 ? 'Critical' : 'Warning'
                  });
          }
                // Water level too high (over-watered)
                else if (reading.waterLevel > 90) {
                  await this.createNotificationIfNeeded({
                    Plant_ID: reading.plant.plant_ID,
                    Type: 'Moisture',
                    Message: `${plantName} may be over-watered! Soil moisture at ${reading.waterLevel.toFixed(1)}%. Consider letting the soil dry out.`,
                    NotificationType: reading.waterLevel > 95 ? 'Critical' : 'Warning'
                  });
                }
              }
              
              // Check humidity levels
              if (reading.airHumidityLevel !== undefined) {
                // Humidity level below threshold (too dry)
                if (reading.airHumidityLevel < this.humidityThreshold) {
                  await this.createNotificationIfNeeded({
                    Plant_ID: reading.plant.plant_ID,
                    Type: 'Humidity',
                    Message: `The air around ${plantName} is too dry! Humidity at ${reading.airHumidityLevel.toFixed(1)}%. Consider using a humidifier or misting the plant.`,
                    NotificationType: reading.airHumidityLevel < 20 ? 'Critical' : 'Warning'
                  });
                } 
                // Humidity level too high
                else if (reading.airHumidityLevel > 80) {
                  await this.createNotificationIfNeeded({
                    Plant_ID: reading.plant.plant_ID,
                    Type: 'Humidity',
                    Message: `The air around ${plantName} is too humid! Humidity at ${reading.airHumidityLevel.toFixed(1)}%. Consider improving air circulation to prevent fungal issues.`,
                    NotificationType: reading.airHumidityLevel > 90 ? 'Critical' : 'Warning'
                  });
                }
              }
              
              // Check temperature levels
              if (reading.temperatureLevel !== undefined) {
                // Temperature below threshold (too cold)
                if (reading.temperatureLevel < this.temperatureThreshold) {
                  await this.createNotificationIfNeeded({
                    Plant_ID: reading.plant.plant_ID,
                    Type: 'Temperature',
                    Message: `${plantName} is too cold! Temperature at ${reading.temperatureLevel.toFixed(1)}°C. Move to a warmer location or away from drafts.`,
                    NotificationType: reading.temperatureLevel < 5 ? 'Critical' : 'Warning'
                  });
                } 
                // Temperature too high (too hot)
                else if (reading.temperatureLevel > 30) {
                  await this.createNotificationIfNeeded({
                    Plant_ID: reading.plant.plant_ID,
                    Type: 'Temperature',
                    Message: `${plantName} is too hot! Temperature at ${reading.temperatureLevel.toFixed(1)}°C. Move to a cooler location or away from direct sunlight.`,
                    NotificationType: reading.temperatureLevel > 35 ? 'Critical' : 'Warning'
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking sensor readings:', error);
        }
      },
      
      async createNotificationIfNeeded(notification) {
        // Avoid duplicate notifications: check if we've sent this notification in the last 24 hours
        const existingNotification = this.notifications.find(n => 
          n.plant_ID === notification.Plant_ID && 
          n.type === notification.Type &&
          new Date(n.dato_Tid) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
          
        if (!existingNotification) {
          try {
            await createNotification(notification);
            console.log(`Created new ${notification.Type} notification for plant ${notification.Plant_ID}`);
            await this.loadNotifications(); // Refresh the notifications list
          } catch (error) {
            console.error('Error creating notification:', error);
          }
        }
      },
      markAllAsRead() {
        markAllAsRead()
          .then(() => {
            // Update local state
            this.notifications.forEach(notification => {
              notification.isRead = true;
            });
          
            // Add a temporary status message
            this.testMessage = 'All notifications marked as read';
            this.testSuccess = true;
            
            // Clear the message after 3 seconds
            setTimeout(() => {
              this.testMessage = '';
            }, 3000);
          
            // Refresh notifications from server
            this.loadNotifications();
          })
          .catch(error => {
            console.error('Error marking all notifications as read:', error);
            
            // Show error message
            this.testMessage = 'Failed to mark notifications as read';
            this.testSuccess = false;
          });
      }
    }
  };
  </script>
  
  <style scoped>
  .notifications-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .title {
    font-size: 2rem;
    color: #166534;
    text-align: center;
    margin-bottom: 2rem;
    font-weight: bold;
  }
  
  .card {
    background-color: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .settings-card {
    background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #166534;
    font-weight: 600;
  }
  
  h3 {
    font-size: 1.1rem;
    margin: 1.5rem 0 0.8rem 0;
    color: #1f2937;
  }
  
  .checkbox-label {
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .thresholds {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    background: rgba(255,255,255,0.7);
    padding: 1rem;
    border-radius: 8px;
  }
  
  .threshold-input label {
    font-size: 1rem;
    color: #2d3748;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .safe-range {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 0.2rem;
    font-style: italic;
  }
  
  input[type='number'] {
    padding: 8px;
    width: 80px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }
  
  .test-notification {
    background: rgba(255,255,255,0.8);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }
  
  .test-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.8rem;
    flex-wrap: wrap;
  }
  
  .plant-select {
    padding: 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    flex: 1;
  }
  
  .notification-type-select {
    padding: 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    flex: 1;
  }
  
  .test-button {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .test-button:hover {
    background-color: #2563eb;
  }
  
  .test-message {
    margin-top: 1rem;
    padding: 0.8rem;
    border-radius: 4px;
    text-align: center;
  }
  
  .test-message.success {
    background-color: #d1fae5;
    color: #065f46;
  }
  
  .test-message.error {
    background-color: #fee2e2;
    color: #b91c1c;
  }
  
  .notification-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .notification-item {
    padding: 0.8rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .notification-item:last-child {
    border-bottom: none;
  }
  
  .notification-item.warning {
    border-left: 4px solid #ffcc00;
  }
  
  .notification-item.critical {
    border-left: 4px solid #ff4757;
  }
  
  .notification-item.normal {
    border-left: 4px solid #22c55e;
  }
  
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .notification-badges {
    display: flex;
    gap: 5px;
  }
  
  .sensor-reading-badge {
    background-color: #e6f7ff;
    color: #0284c7;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: bold;
  }
  
  .critical-badge, .warning-badge, .normal-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: bold;
  }
  
  .notification-item.warning-entry {
    border-left: 4px solid #ffcc00;
  }
  
  .notification-item.critical-entry {
    border-left: 4px solid #ff4757;
  }
  
  .notification-item.normal-entry {
    border-left: 4px solid #22c55e;
  }
  
  .notification-time {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }
  
  .notification-content {
    display: flex;
    align-items: flex-start;
  }
  
  .notification-icon {
    font-size: 1.5rem;
    margin-right: 1rem;
    flex-shrink: 0;
  }
  
  .notification-text {
    flex: 1;
  }
  
  .notification-message {
    margin: 0 0 4px;
    font-size: 14px;
    line-height: 1.4;
    white-space: normal;
    word-break: break-word;
  }
  
  .notification-sensor-readings {
    margin: 8px 0 0;
    font-size: 13px;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 6px 8px;
    border-radius: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  
  .reading-label {
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.7;
    margin-right: 4px;
  }
  
  .reading-value {
    background-color: rgba(255, 255, 255, 0.6);
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
  }
  
  .notification-plant {
    font-size: 12px;
    color: #666;
    margin: 0;
  }
  
  .empty-state {
    text-align: center;
    color: #6b7280;
    padding: 2rem 0;
  }
  
  @media (max-width: 768px) {
    .notifications-container {
      padding: 1.5rem;
      padding-top: 4rem; /* Add space for fixed navbar */
    }
    
    .title {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      display: block;
    }
    
    .card {
      padding: 1.2rem;
      margin-bottom: 1.5rem;
    }
    
    .card-title {
      font-size: 1.3rem;
      margin-bottom: 1.2rem;
    }
    
    .thresholds {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .test-controls {
      flex-direction: column;
      align-items: stretch;
    }
  }
  
  @media (max-width: 480px) {
    .notifications-container {
      padding: 1rem;
      padding-top: 4rem; /* Keep space for fixed navbar */
    }
    
    .title {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .card {
      padding: 1rem;
      border-radius: 8px;
    }
    
    .card-title {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      display: block;
      font-weight: bold;
    }
    
    .test-notification {
      margin-top: 1.5rem;
      text-align: center;
    }
    
    .notification-item {
      padding: 0.8rem;
    }
  }
  
  .critical-badge {
    background-color: #ffebee;
    color: #d32f2f;
  }
  
  .warning-badge {
    background-color: #fff8e1;
    color: #ff8f00;
  }
  
  .normal-badge {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  .notification-header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }
  
  .mark-all-button {
    border: none;
    background: #16a34a;
    color: white;
    font-size: 0.85rem;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .mark-all-button:hover {
    background: #15803d;
  }
  </style>