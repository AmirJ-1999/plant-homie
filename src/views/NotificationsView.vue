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
          </div>
          <div class="threshold-input">
            <label>
              Moisture Alert Threshold (%):
              <input type="number" id="moisture-threshold" name="moisture-threshold" v-model.number="moistureThreshold" @change="saveNotificationPreferences" />
            </label>
          </div>
        </div>
        
        <div class="test-notification">
          <h3>Test Notification</h3>
          <div class="test-controls">
            <select v-model="testNotificationType" id="notification-type" name="notification-type" class="notification-type-select">
              <option value="Water">Water</option>
              <option value="Humidity">Humidity</option>
              <option value="Temperature">Temperature</option>
            </select>
            <button @click="createTestNotification" class="test-button">Create Test Notification</button>
          </div>
          <div v-if="testMessage" class="test-message" :class="{ success: testSuccess, error: !testSuccess }">
            {{ testMessage }}
          </div>
        </div>
      </div>
  
      <div class="card">
        <h2>Recent Notifications</h2>
        <div v-if="notifications.length === 0" class="empty-state">
          No notifications yet
        </div>
        <ul class="notification-list" v-else>
          <li v-for="notification in notifications" :key="notification.notification_ID" class="notification-item">
            <div class="notification-time">{{ formatDate(notification.dato_Tid) }}</div>
            <div class="notification-content">
              <div class="notification-icon">
                <span v-if="notification.type === 'Water'">💧</span>
                <span v-else-if="notification.type === 'Humidity'">💨</span>
                <span v-else-if="notification.type === 'Temperature'">🌡️</span>
                <span v-else>🔔</span>
              </div>
              <div class="notification-text">
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-plant">{{ notification.plant?.plant_Name || 'Unknown plant' }}</div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script>
  import { getAllNotifications, createNotification } from '@/services/NotificationService';
  import { API } from '@/services/api';
  
  export default {
    name: 'NotificationsView',
    data() {
      return {
        notificationsEnabled: true,
        humidityThreshold: 40,
        moistureThreshold: 30,
        notifications: [],
        testNotificationType: 'Water',
        testMessage: '',
        testSuccess: false,
        refreshInterval: null
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
      }
      
      // Load notifications from backend
      await this.loadNotifications();
      
      // Set up auto-refresh every 30 seconds
      this.refreshInterval = setInterval(async () => {
        await this.loadNotifications();
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
            
            this.notifications = sortedNotifications;
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
                  type: 'Water',
                  message: 'Your plant needs water! Moisture level is low.',
                  plant: { plant_Name: 'Demo Plant' }
                },
                {
                  notification_ID: 'mock-2',
                  dato_Tid: new Date(Date.now() - 3600000),
                  type: 'Humidity',
                  message: 'Humidity level is below the recommended threshold.',
                  plant: { plant_Name: 'Demo Plant' }
                },
                {
                  notification_ID: 'mock-3',
                  dato_Tid: new Date(Date.now() - 7200000),
                  type: 'Temperature',
                  message: 'Temperature is outside optimal range for your plant.',
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
          moistureThreshold: this.moistureThreshold
        };
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
      },
      async createTestNotification() {
        this.testMessage = 'Creating notification...';
        
        try {
          // First check if user has any plants, if not create one
          let plantId = 1; // Default as fallback
          
          try {
            const plantResponse = await API.get('/plant');
            if (plantResponse.data && 
                ((plantResponse.data.$values && plantResponse.data.$values.length > 0) || 
                 (Array.isArray(plantResponse.data) && plantResponse.data.length > 0))) {
              // Use first plant found
              const plants = plantResponse.data.$values || plantResponse.data;
              plantId = plants[0].plant_ID || plants[0].Plant_ID || 1;
              console.log(`Using existing plant ID: ${plantId}`);
            } else {
              // No plants found, create one
              console.log('No plants found, creating default plant');
              const defaultPlant = {
                Plant_Name: 'My First Plant',
                Plant_Type: 'Indoor Plant',
                plant_Name: 'My First Plant', 
                plant_Type: 'Indoor Plant'
              };
              
              const createResponse = await API.post('/plant', defaultPlant);
              if (createResponse.data && createResponse.data.plant_ID) {
                plantId = createResponse.data.plant_ID || createResponse.data.Plant_ID || 1;
                console.log(`Created new plant with ID: ${plantId}`);
              }
            }
          } catch (error) {
            console.error('Error checking/creating plant:', error);
            // Continue with default plantId = 1
          }
          
          // Generate message based on notification type
          let message;
          switch(this.testNotificationType) {
            case 'Water':
              message = 'Your plant needs water! Moisture level is low.';
              break;
            case 'Humidity':
              message = 'Humidity level is below the recommended threshold.';
              break;
            case 'Temperature':
              message = 'Temperature is outside optimal range for your plant.';
              break;
            default:
              message = 'System notification';
          }
          
          // Create notification object with both camelCase and PascalCase properties
          // to ensure compatibility with the backend API
          const notification = {
            Plant_ID: plantId,
            Message: message,
            Type: this.testNotificationType,
            plant_Type: this.testNotificationType,
            message: message, // Add lowercase version
            plant_ID: plantId, // Add lowercase version
            type: this.testNotificationType, // Add lowercase version
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
    gap: 1rem;
    align-items: center;
    margin-top: 0.8rem;
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
    padding: 0.8rem 0;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .notification-item:last-child {
    border-bottom: none;
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
    font-weight: 500;
    color: #1f2937;
  }
  
  .notification-plant {
    font-size: 0.9rem;
    color: #4b5563;
    margin-top: 0.2rem;
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
  </style>