<template>
  <div class="dashboard-container">
    <div class="user-panel">
      <div class="user-info">
        <div class="user-avatar">👤</div>
        <div class="user-details">
          <div class="username">{{ username }}</div>
          <div class="subscription">{{ subscription }}</div>
        </div>
      </div>
    </div>
    
    <h1 class="title">🌿 Plant Homie Dashboard</h1>

    <div class="grid">
      <!-- Status Panel -->
      <div class="card status-card">
        <div class="card-header">
          <h2>Plant Status</h2>
          <div class="health-indicator" :class="plantHealthClass">{{ plantHealth }}</div>
        </div>
        
        <div class="readings">
          <div class="reading moisture">
            <div class="reading-icon">💧</div>
            <div class="reading-details">
              <div class="reading-label">Moisture</div>
              <div class="reading-value">{{ moisture.toFixed(2) }}%</div>
              <div class="reading-bar">
                <div class="reading-progress" :style="{width: `${Math.min(moisture, 100)}%`}"></div>
              </div>
            </div>
          </div>
          
          <div class="reading humidity">
            <div class="reading-icon">☁️</div>
            <div class="reading-details">
              <div class="reading-label">Humidity</div>
              <div class="reading-value">{{ humidity.toFixed(2) }}%</div>
              <div class="reading-bar">
                <div class="reading-progress" :style="{width: `${Math.min(humidity, 100)}%`}"></div>
              </div>
            </div>
          </div>
          
          <div class="reading temperature">
            <div class="reading-icon">🌡️</div>
            <div class="reading-details">
              <div class="reading-label">Temperature</div>
              <div class="reading-value">{{ temperature.toFixed(2) }}°C</div>
              <div class="reading-bar">
                <div class="reading-progress" :style="{width: `${Math.min(temperature*3.33, 100)}%`}"></div>
              </div>
            </div>
          </div>
          
          <div class="reading watered">
            <div class="reading-icon">🕒</div>
            <div class="reading-details">
              <div class="reading-label">Last Watered</div>
              <div class="reading-value last-watered">{{ lastWatered }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Panel -->
      <div class="card actions-card">
        <h2>Actions</h2>
        
        <button @click="waterPlant" class="water-button">
          <span class="button-icon">💧</span>
          <span>Water Plant</span>
        </button>
        
        <div class="auto-mode-toggle">
          <label class="toggle-label">
            <input type="checkbox" id="auto-watering-toggle" name="auto-watering" v-model="autoMode" @change="toggleAutoMode" />
            <span class="toggle-slider"></span>
            <span class="toggle-text">{{ autoMode ? 'Auto-Mode Enabled' : 'Enable Auto-Mode' }}</span>
          </label>
        </div>
        
        <div v-if="message" class="message" :class="{ 'active': message }">
          {{ message }}
        </div>
        
        <!-- Subscription Management -->
        <div class="subscription-management">
          <h3>Your Subscription</h3>
          <div class="current-plan">
            <div class="plan-badge" :class="subscriptionClass">{{ formatSubscription }}</div>
            <div class="plan-details">
              <div v-if="subscription === 'Free'">10 plants max, weekly password change required</div>
              <div v-else-if="subscription === 'Premium_Silver'">30 plants max, weekly password change required</div>
              <div v-else-if="subscription === 'Premium_Gold'">50 plants max, weekly password change required</div>
              <div v-else-if="subscription === 'Premium_Plat'">100 plants max, no password change required</div>
            </div>
          </div>
          
          <button @click="showUpgradeModal = true" class="upgrade-button">
            <span class="button-icon">⭐</span>
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- History Section -->
    <div class="card history-card">
      <h2>Recent Activity</h2>
      <div class="history-timeline">
        <div v-for="entry in history" :key="entry.id" class="history-item">
          <div class="history-time">{{ formatTime(entry.timestamp) }}</div>
          <div class="history-date">{{ formatDate(entry.timestamp) }}</div>
          <div class="history-content">
            <div class="history-icon">{{ entry.icon || '📊' }}</div>
            <div class="history-text">{{ entry.action }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upgrade Subscription Modal -->
    <div v-if="showUpgradeModal" class="modal-overlay" @click="showUpgradeModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Change Your Subscription</h3>
          <button class="close-button" @click="showUpgradeModal = false">×</button>
        </div>
        
        <div class="modal-content">
          <div class="subscription-options">
            <div class="subscription-card" 
                 :class="{ 'selected': selectedPlan === 'Free', 'current': subscription === 'Free' }" 
                 @click="selectedPlan = 'Free'">
              <div v-if="subscription === 'Free'" class="current-tag">Current</div>
              <div class="plan-header">
                <div class="plan-icon">🌱</div>
                <div class="plan-name">Free</div>
              </div>
              <div class="plan-price">$0 <span class="price-period">/month</span></div>
              <ul class="plan-features">
                <li>10 plants</li>
                <li>Weekly password change required</li>
                <li>Basic plant care tips</li>
              </ul>
              <div class="plan-select">
                <input type="radio" id="modal-plan-free" name="modal-plan" value="Free" v-model="selectedPlan" />
                <label for="modal-plan-free">Select</label>
              </div>
            </div>
            
            <div class="subscription-card" 
                 :class="{ 'selected': selectedPlan === 'Premium_Silver', 'current': subscription === 'Premium_Silver' }" 
                 @click="selectedPlan = 'Premium_Silver'">
              <div v-if="subscription === 'Premium_Silver'" class="current-tag">Current</div>
              <div class="plan-header">
                <div class="plan-icon">🥈</div>
                <div class="plan-name">Silver</div>
              </div>
              <div class="plan-price">$5 <span class="price-period">/month</span></div>
              <ul class="plan-features">
                <li>30 plants</li>
                <li>Weekly password change required</li>
                <li>Advanced plant care guides</li>
              </ul>
              <div class="plan-select">
                <input type="radio" id="modal-plan-silver" name="modal-plan" value="Premium_Silver" v-model="selectedPlan" />
                <label for="modal-plan-silver">Select</label>
              </div>
            </div>
            
            <div class="subscription-card" 
                 :class="{ 'selected': selectedPlan === 'Premium_Gold', 'current': subscription === 'Premium_Gold' }" 
                 @click="selectedPlan = 'Premium_Gold'">
              <div v-if="subscription === 'Premium_Gold'" class="current-tag">Current</div>
              <div class="plan-header">
                <div class="plan-icon">🥇</div>
                <div class="plan-name">Gold</div>
              </div>
              <div class="plan-price">$20 <span class="price-period">/month</span></div>
              <ul class="plan-features">
                <li>50 plants</li>
                <li>Weekly password change required</li>
                <li>Premium plant statistics</li>
              </ul>
              <div class="plan-select">
                <input type="radio" id="modal-plan-gold" name="modal-plan" value="Premium_Gold" v-model="selectedPlan" />
                <label for="modal-plan-gold">Select</label>
              </div>
            </div>
            
            <div class="subscription-card" 
                 :class="{ 'selected': selectedPlan === 'Premium_Plat', 'current': subscription === 'Premium_Plat' }" 
                 @click="selectedPlan = 'Premium_Plat'">
              <div v-if="subscription === 'Premium_Plat'" class="current-tag">Current</div>
              <div class="popular-badge">Most Popular</div>
              <div class="plan-header">
                <div class="plan-icon">💎</div>
                <div class="plan-name">Platinum</div>
              </div>
              <div class="plan-price">$50 <span class="price-period">/month</span></div>
              <ul class="plan-features">
                <li>100 plants</li>
                <li>No password change required</li>
                <li>Priority plant support</li>
              </ul>
              <div class="plan-select">
                <input type="radio" id="modal-plan-platinum" name="modal-plan" value="Premium_Plat" v-model="selectedPlan" />
                <label for="modal-plan-platinum">Select</label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-button" @click="showUpgradeModal = false">Cancel</button>
          <button class="confirm-button" @click="changeSubscription" :disabled="selectedPlan === subscription">
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getLatestNotification } from '@/services/NotificationService';
import { getLatestSensorReadings, saveManualWateringEvent, saveAutoModeEvent, getAllPlantLogs, generateInitialSensorData } from '@/services/PlantLogService';
import { API } from '@/services/api';
import { updateUserSubscription, getUserById } from '@/services/UserService';

export default {
  name: 'DashboardView',
  data() {
    return {
      username: 'Loading...',
      subscription: 'Loading...',
      moisture: 0,
      humidity: 0,
      temperature: 0,
      lastWatered: 'Loading...',
      autoMode: false,
      message: '',
      history: [],
      notifications: [],
      showUpgradeModal: false,
      selectedPlan: 'Free',
      refreshInterval: null,
    };
  },
  computed: {
    plantHealth() {
      // Udregner plantens sundhed ud fra fugtighed, luftfugtighed og temperatur
      if (this.moisture > 60 && this.humidity > 40 && this.temperature > 18 && this.temperature < 28) {
        return 'Excellent';
      } else if (this.moisture > 40 && this.humidity > 30 && this.temperature > 15 && this.temperature < 30) {
        return 'Good';
      } else if (this.moisture > 20 && this.humidity > 20 && this.temperature > 10 && this.temperature < 32) {
        return 'Fair';
      } else {
        return 'Needs Attention';
      }
    },
    plantHealthClass() {
      const health = this.plantHealth;
      if (health === 'Excellent') return 'health-excellent';
      if (health === 'Good') return 'health-good';
      if (health === 'Fair') return 'health-fair';
      return 'health-poor';
    },
    formatSubscription() {
      if (this.subscription === 'Free') return 'Free';
      if (this.subscription === 'Premium_Silver') return 'Silver';
      if (this.subscription === 'Premium_Gold') return 'Gold';
      if (this.subscription === 'Premium_Plat') return 'Platinum';
      return 'Unknown';
    },
    subscriptionClass() {
      if (this.subscription === 'Free') return 'plan-free';
      if (this.subscription === 'Premium_Silver') return 'plan-silver';
      if (this.subscription === 'Premium_Gold') return 'plan-gold';
      if (this.subscription === 'Premium_Plat') return 'plan-platinum';
      return 'plan-unknown';
    }
  },
  methods: {
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    },
    async fetchUserInfo() {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        // Get userId from sessionStorage
        const userId = sessionStorage.getItem('userId');
        
        if (!userId) {
          console.error('User ID not found in session storage');
          // Check if we can fall back to session storage values for username and subscription
          const fallbackUsername = sessionStorage.getItem('username');
          const fallbackSubscription = sessionStorage.getItem('subscription');
          
          if (fallbackUsername && fallbackSubscription) {
            this.username = fallbackUsername;
            this.subscription = fallbackSubscription;
          } else {
            this.username = 'Unknown User';
            this.subscription = 'Free'; // Default to free if we can't determine
          }
        } else {
          console.log('Fetching user profile data for userId:', userId);
          
          try {
            // Try to get user profile from API using UserService
            const profileResponse = await getUserById(userId);
            
            if (profileResponse.data && profileResponse.status !== 500) {
              // Extract user data from response
              const userData = profileResponse.data;
              console.log('User profile data:', userData);
              
              // Update component data with user information
              this.username = userData.userName || userData.UserName || userData.username || 'Unknown User';
              this.subscription = userData.subscription || userData.Subscription || 'Free';
              
              // Store in session storage for future use
              sessionStorage.setItem('username', this.username);
              sessionStorage.setItem('subscription', this.subscription);
            } else if (profileResponse.status >= 400) {
              console.error('Error in profile response:', profileResponse);
              // Try to fall back to session storage values
              this.username = sessionStorage.getItem('username') || 'Unknown User';
              this.subscription = sessionStorage.getItem('subscription') || 'Free';
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            
            // Fall back to session storage values if available
            this.username = sessionStorage.getItem('username') || 'Unknown User';
            this.subscription = sessionStorage.getItem('subscription') || 'Free';
          }
        }
        
        // Make sure username and subscription are not "Loading..." if we have actual values
        if (this.username === 'Loading...' && sessionStorage.getItem('username')) {
          this.username = sessionStorage.getItem('username');
        }
        
        if (this.subscription === 'Loading...' && sessionStorage.getItem('subscription')) {
          this.subscription = sessionStorage.getItem('subscription');
        }
        
        // If subscription is still "Loading..." or empty, use a default value
        if (this.subscription === 'Loading...' || !this.subscription) {
          this.subscription = 'Free';
        }
        
        // Set selected plan to current subscription for the upgrade modal
        this.selectedPlan = this.subscription;
        
        // Update last watered timestamp
        this.lastWatered = new Date().toLocaleString();
        
        // Get auto-watering status from localStorage
        const savedAutoMode = localStorage.getItem('autoWaterMode');
        if (savedAutoMode !== null) {
          this.autoMode = savedAutoMode === 'true';
          console.log('Auto-water mode initialized to:', this.autoMode);
        }
      } catch (err) {
        console.error('Could not fetch user data:', err);
        
        // Set fallback values
        this.username = sessionStorage.getItem('username') || 'Unknown User';
        this.subscription = sessionStorage.getItem('subscription') || 'Free';
        this.selectedPlan = this.subscription;
      }
    },
    async fetchStatus() {
      try {
        // Store current values to check if they're meaningful
        const currentValues = {
          moisture: this.moisture,
          humidity: this.humidity,
          temperature: this.temperature
        };
        
        // Check if we already have meaningful values (not defaults)
        const hasRealValues = 
          currentValues.moisture !== 50 && 
          currentValues.humidity !== 50 && 
          currentValues.temperature !== 50;
        
        console.log('Current sensor values before API call:', currentValues, 'hasRealValues:', hasRealValues);
        
        const readings = await getLatestSensorReadings(1);
        
        // Only update values from API if they seem valid (not default 50s)
        const apiHasRealValues = 
          readings.moisture !== 50 && 
          readings.humidity !== 45 && 
          readings.temperature !== 22 &&
          readings.temperature !== 23.5;
          
        console.log('API returned sensor values:', readings, 'apiHasRealValues:', apiHasRealValues);
        
        if (apiHasRealValues) {
          // API returned non-default values, use them
          this.moisture = readings.moisture;
          this.humidity = readings.humidity;
          this.temperature = readings.temperature;
          console.log('Updated with API values:', { moisture: this.moisture, humidity: this.humidity, temperature: this.temperature });
        } else if (!hasRealValues) {
          // Only use API values as fallback if we don't already have real values
          this.moisture = readings.moisture;
          this.humidity = readings.humidity;
          this.temperature = readings.temperature;
          console.log('Using API values as fallback:', { moisture: this.moisture, humidity: this.humidity, temperature: this.temperature });
        } else {
          console.log('Keeping current values instead of API defaults');
        }
        
        // Update last watered time if not already set
        if (this.lastWatered === 'Loading...' || new Date(this.lastWatered).toString() === 'Invalid Date') {
          this.lastWatered = new Date().toLocaleString();
        }
        
        // Load auto-watering mode from localStorage
        const savedAutoMode = localStorage.getItem('autoWaterMode');
        if (savedAutoMode !== null) {
          this.autoMode = savedAutoMode === 'true';
          console.log('Auto-water mode initialized to:', this.autoMode);
        }
        
        // Also check the latest auto-watering state from history
        try {
          const historyRes = await getAllPlantLogs({ limit: 5 });
          if (Array.isArray(historyRes.data) && historyRes.data.length > 0) {
            // Look for the most recent auto-watering event
            const autoEvents = historyRes.data.filter(log => {
              const lightLevel = log.lightLevel || log.light_Level;
              return lightLevel === 999 || lightLevel === 0;
            });
            
            if (autoEvents.length > 0) {
              // Sort by date, newest first
              autoEvents.sort((a, b) => {
                const dateA = new Date(a.dato_Tid || a.datoTid || a.timestamp || a.date);
                const dateB = new Date(b.dato_Tid || b.datoTid || b.timestamp || b.date);
                return dateB - dateA;
              });
              
              // Get the most recent state
              const mostRecent = autoEvents[0];
              const lightLevel = mostRecent.lightLevel || mostRecent.light_Level;
              const serverAutoMode = lightLevel === 999;
              
              // If server state is different from localStorage, use server state
              if (this.autoMode !== serverAutoMode) {
                console.log('Updating auto-mode from server state:', serverAutoMode);
                this.autoMode = serverAutoMode;
                localStorage.setItem('autoWaterMode', this.autoMode.toString());
              }
            }
          }
        } catch (err) {
          console.error('Could not fetch auto-water mode history:', err);
        }
      } catch (err) {
        console.error('Could not fetch sensor readings from API:', err);
        
        // Only try to get history values if we don't already have real values
        const hasRealValues = 
          this.moisture !== 50 && 
          this.humidity !== 50 && 
          this.temperature !== 50;
          
        if (!hasRealValues) {
          // Try to get the most recent sensor data from plant logs history
          try {
            const historyRes = await getAllPlantLogs({ limit: 10 });
            if (Array.isArray(historyRes.data) && historyRes.data.length > 0) {
              // Filter out non-sensor logs and sort by date (newest first)
              const sensorLogs = historyRes.data
                .filter(log => {
                  const lightLevel = log.lightLevel || log.light_Level;
                  // Only consider regular sensor logs (not watering events)
                  return lightLevel !== 999 && lightLevel !== 0 && lightLevel !== 1;
                })
                .sort((a, b) => {
                  const dateA = new Date(a.dato_Tid || a.datoTid || a.timestamp || a.date);
                  const dateB = new Date(b.dato_Tid || b.datoTid || b.timestamp || b.date);
                  return dateB - dateA;
                });
              
              if (sensorLogs.length > 0) {
                const latestLog = sensorLogs[0];
                
                // Extract values from the latest log, handling different field naming conventions
                this.moisture = typeof latestLog.waterLevel === 'number' ? latestLog.waterLevel : 
                               (typeof latestLog.water_Level === 'number' ? latestLog.water_Level : 50);
                
                this.humidity = typeof latestLog.airHumidityLevel === 'number' ? latestLog.airHumidityLevel : 
                               (typeof latestLog.air_Humidity_Level === 'number' ? latestLog.air_Humidity_Level : 45);
                
                this.temperature = typeof latestLog.temperatureLevel === 'number' ? latestLog.temperatureLevel : 
                                 (typeof latestLog.temperature_Level === 'number' ? latestLog.temperature_Level : 23.5);
                
                console.log('Using latest sensor values from history:', { 
                  moisture: this.moisture, 
                  humidity: this.humidity, 
                  temperature: this.temperature 
                });
                
                // Update lastWatered from history if we have a manual watering entry
                const wateringEvents = historyRes.data
                  .filter(log => {
                    const lightLevel = log.lightLevel || log.light_Level;
                    const logAction = log.action || log.Action;
                    return lightLevel === 1 || logAction === 'Manual Watering';
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.dato_Tid || a.datoTid || a.timestamp || a.date);
                    const dateB = new Date(b.dato_Tid || b.datoTid || b.timestamp || b.date);
                    return dateB - dateA;
                  });
                
                if (wateringEvents.length > 0) {
                  const lastWateredTimestamp = wateringEvents[0].dato_Tid || 
                                             wateringEvents[0].datoTid || 
                                             wateringEvents[0].timestamp || 
                                             wateringEvents[0].date;
                  this.lastWatered = new Date(lastWateredTimestamp).toLocaleString();
                }
              } else {
                // No sensor logs found, fall back to defaults
                console.log('No sensor logs found in history, using defaults');
                this.moisture = 50;
                this.humidity = 45;
                this.temperature = 23.5;
              }
            } else {
              // No logs found, fall back to defaults
              console.log('No logs found in history, using defaults');
              this.moisture = 50;
              this.humidity = 45;
              this.temperature = 23.5;
            }
          } catch (historyError) {
            console.error('Could not fetch sensor readings from history:', historyError);
            // Fallback to default values as last resort
            this.moisture = 50;
            this.humidity = 45;
            this.temperature = 23.5;
          }
        } else {
          console.log('Keeping current real values instead of loading defaults');
        }
        
        this.lastWatered = this.lastWatered || new Date().toLocaleString();
        
        // Still try to get auto mode from localStorage
        const savedAutoMode = localStorage.getItem('autoWaterMode');
        if (savedAutoMode !== null) {
          this.autoMode = savedAutoMode === 'true';
          console.log('Auto-water mode initialized to:', this.autoMode);
        }
      }
    },
    waterPlant() {
      this.message = 'Watering your plant...';
      
      saveManualWateringEvent({
        plantId: 1,
        moisture: this.moisture,
        humidity: this.humidity,
        temperature: this.temperature
      })
        .then(response => {
          console.log('Manual watering event saved successfully:', response.data);
          this.message = 'Plant watered successfully!';
          this.lastWatered = new Date().toLocaleString();
          
          // Add to local history
          this.history.unshift({
            id: Date.now(),
            timestamp: new Date(),
            action: 'Plant watered manually',
            icon: '💧'
          });
          
          // Refresh history from the server
          this.loadHistory();
          
          // Clear message after 3 seconds
      setTimeout(() => {
            this.message = '';
          }, 3000);
        })
        .catch(err => {
          console.error('Could not save manual watering event:', err);
          this.message = 'Water action recorded locally only.';
          
          // Still update local UI
        this.lastWatered = new Date().toLocaleString();
        this.history.unshift({
          id: Date.now(),
            timestamp: new Date(),
            action: 'Plant watered manually (local only)',
            icon: '💧'
          });
          
          // Clear message after 3 seconds
          setTimeout(() => {
            this.message = '';
          }, 3000);
        });
    },
    toggleAutoMode() {
      // Toggle auto-watering mode
      this.autoMode = !this.autoMode;
      
      // Save the new status in localStorage
      localStorage.setItem('autoWaterMode', this.autoMode.toString());
      
      // Show an appropriate message to the user
      this.message = this.autoMode ? 'Auto-mode enabled' : 'Auto-mode disabled';
      
      // Add the event to history
      this.history.unshift({
        id: Date.now(),
        timestamp: new Date(),
        action: this.autoMode ? 'Auto-watering mode enabled' : 'Auto-watering mode disabled',
        icon: '🤖'
      });
      
      // Also send the new status to the backend so it's saved there
      this.saveAutoModeEvent(this.autoMode);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        this.message = '';
      }, 3000);
    },
    async saveAutoModeEvent(isEnabled) {
      try {
        const response = await saveAutoModeEvent({
          plantId: 1,
          isEnabled: isEnabled,
          moisture: this.moisture,
          humidity: this.humidity,
          temperature: this.temperature
        });
        
        if (response.status === 200 || response.status === 201) {
          console.log('Auto-water mode event saved successfully:', isEnabled ? 'enabled' : 'disabled');
          
          // Refresh history to show the new entry
          this.loadHistory();
        }
      } catch (err) {
        console.error('Could not save auto-mode event to backend:', err);
      }
    },
    async loadHistory() {
      try {
        // Load plant logs from service
        const res = await getAllPlantLogs({ limit: 10 });
        let historyItems = [];
        
        if (Array.isArray(res.data)) {
          // Process the plant log data
          historyItems = res.data.map(log => {
            // Handle variations in field names and ensure values are valid numbers
            const lightLevel = log.lightLevel !== undefined ? log.lightLevel : log.light_Level;
            const timestamp = new Date(log.dato_Tid || log.datoTid || log.timestamp || log.date);
            const plantLogId = log.plantLog_ID || log.plantLogId || log.id;
            
            // Ensure temperature, moisture and humidity have valid numeric values
            const temperature = typeof log.temperatureLevel === 'number' ? log.temperatureLevel : 
                               (typeof log.temperature_Level === 'number' ? log.temperature_Level : 0);
            
            const moisture = typeof log.waterLevel === 'number' ? log.waterLevel : 
                            (typeof log.water_Level === 'number' ? log.water_Level : 0);
            
            const humidity = typeof log.airHumidityLevel === 'number' ? log.airHumidityLevel : 
                            (typeof log.air_Humidity_Level === 'number' ? log.air_Humidity_Level : 0);
            
            const logAction = log.action || log.Action || '';
            
            // Check if this is an auto-watering event
            if (lightLevel === 999 || lightLevel === 0) {
              const isEnabled = lightLevel === 999;
              return {
                id: plantLogId,
                timestamp: timestamp,
                action: isEnabled ? 'Auto-watering mode enabled' : 'Auto-watering mode disabled',
                icon: '🤖'
              };
            } 
            // Check if this is a manual watering event
            else if (lightLevel === 1 || logAction === 'Manual Watering') {
              return {
                id: plantLogId,
                timestamp: timestamp,
                action: 'Plant watered manually',
                icon: '💧'
              };
            }
            // Regular sensor log
            else {
              return {
                id: plantLogId,
                timestamp: timestamp,
                action: `Temp: ${temperature.toFixed(2)}°C, Moisture: ${moisture.toFixed(2)}%, Humidity: ${humidity.toFixed(2)}%`,
                icon: '📊'
              };
            }
          });
        }
        
        // Try to fetch notifications
        try {
          const notificationRes = await getLatestNotification();
          if (notificationRes.data) {
            const notification = notificationRes.data;
            // Determine notification icon based on type
            let icon = '🔔';
            if (notification.type === 'Water') icon = '💧';
            else if (notification.type === 'Humidity') icon = '💨';
            else if (notification.type === 'Temperature') icon = '🌡️';
            
            historyItems.push({
              id: `notification-${notification.notification_ID}`,
              timestamp: new Date(notification.dato_Tid),
              action: notification.message || 'System notification',
              icon: icon
            });
          }
        } catch (notificationErr) {
          console.error('Could not fetch notifications:', notificationErr);
        }
        
        // Sort by timestamp, newest first
        this.history = historyItems.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
      } catch (err) {
        console.error('Could not fetch history from backend:', err);
        this.history = [];
      }
    },
    async changeSubscription() {
      this.message = 'Updating subscription...';
      
      try {
        // Get the current user's ID
        const userId = sessionStorage.getItem('userId');
        
        if (!userId) {
          this.message = 'Error: User ID not found';
          return;
        }
        
        console.log(`Updating subscription for user ${userId} to ${this.selectedPlan}`);
        
        // Update user subscription using the UserService
        const response = await updateUserSubscription(userId, this.selectedPlan);
        
        // Check if the update was successful
        if (response.status === 200 || response.status === 204) {
          console.log('Subscription update response:', response.data);
          
          // Update local storage and session storage
          sessionStorage.setItem('subscription', this.selectedPlan);
          localStorage.setItem('userSubscription', this.selectedPlan);
          
          // Update the current subscription in the component
          this.subscription = this.selectedPlan;
          this.message = 'Subscription updated successfully!';
          this.showUpgradeModal = false;
          
          // Clear message after 3 seconds
          setTimeout(() => {
            this.message = '';
          }, 3000);
        } else {
          throw new Error(`Received unexpected response status: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to update subscription:', error);
        
        // Fallback for development/testing - still update local UI
        if (process.env.NODE_ENV !== 'production') {
          sessionStorage.setItem('subscription', this.selectedPlan);
          localStorage.setItem('userSubscription', this.selectedPlan);
          this.subscription = this.selectedPlan;
          this.message = 'Subscription updated locally (API not available)';
          this.showUpgradeModal = false;
          
          // Clear message after 3 seconds
          setTimeout(() => {
            this.message = '';
          }, 3000);
        } else {
          this.message = `Error updating subscription: ${error.message || 'Unknown error'}`;
          
          // Clear error message after 5 seconds
          setTimeout(() => {
            this.message = '';
          }, 5000);
        }
      }
    },
    async checkAndCreateDefaultPlant() {
      try {
        // First check if user already has plants
        const response = await API.get('/plant');
        console.log('Checking if user has plants:', response.data);
        
        let plantId;
        let isNewPlant = false;
        
        if ((!response.data.$values || response.data.$values.length === 0) && 
            (!Array.isArray(response.data) || response.data.length === 0)) {
          // User has no plants, create a default one
          console.log('No plants found for user, creating default plant');
          const defaultPlant = {
            Plant_Name: 'My First Plant',
            Plant_Type: 'Indoor Plant',
            plant_Name: 'My First Plant',
            plant_Type: 'Indoor Plant'
          };
          
          const createResponse = await API.post('/plant', defaultPlant);
          console.log('Default plant created:', createResponse.data);
          
          // Extract plant ID from response
          if (createResponse.data && (createResponse.data.plant_ID || createResponse.data.Plant_ID)) {
            plantId = createResponse.data.plant_ID || createResponse.data.Plant_ID;
            isNewPlant = true;
          }
        } else {
          // User already has plants, get the ID of the first one
          console.log('User already has plants:', Array.isArray(response.data.$values) ? response.data.$values.length : 'No $values array');
          if (response.data.$values && response.data.$values.length > 0) {
            plantId = response.data.$values[0].plant_ID || response.data.$values[0].Plant_ID;
          } else if (Array.isArray(response.data) && response.data.length > 0) {
            plantId = response.data[0].plant_ID || response.data[0].Plant_ID;
          }
        }
        
        // If we created a new plant or we have the ID of an existing plant, check if it has data
        if (plantId) {
          try {
            // Check if plant has any logs
            const logsResponse = await getAllPlantLogs({ limit: 1 });
            const hasLogs = logsResponse.data && logsResponse.data.length > 0;
            
            // If this is a brand new plant or a plant with no logs, generate seed data
            if (isNewPlant || !hasLogs) {
              console.log('Plant has no logs, generating initial sensor data');
              await generateInitialSensorData(plantId);
            }
          } catch (error) {
            console.error('Error checking plant logs:', error);
          }
          
          return { plant_ID: plantId };
        } else {
          // Create a local fallback plant anyway
          return { plant_ID: 1, plant_Name: 'My Plant', plant_Type: 'Default' };
        }
      } catch (error) {
        console.error('Error checking/creating plants:', error);
        // Create a local fallback plant anyway
        return { plant_ID: 1, plant_Name: 'My Plant', plant_Type: 'Default' };
      }
    },
  },
  async mounted() {
    // First fetch user information
    await this.fetchUserInfo();
    
    // Check if user has plants and create one if not
    await this.checkAndCreateDefaultPlant();
    
    // First try to get sensor data directly from history
    try {
      const historyRes = await getAllPlantLogs({ limit: 20 });
      if (Array.isArray(historyRes.data) && historyRes.data.length > 0) {
        console.log('Got history logs:', historyRes.data);
        
        // Try to find sensor readings directly from the logs
        const sensorLogs = historyRes.data
          .filter(log => {
            // Check if this is a sensor reading entry (not auto-water or manual water)
            const lightLevel = log.lightLevel || log.light_Level;
            // eslint-disable-next-line no-unused-vars
            const logAction = log.action || log.Action;
            return (lightLevel !== 999 && lightLevel !== 0 && lightLevel !== 1) || 
                  (typeof log.temperatureLevel === 'number' || typeof log.temperature_Level === 'number');
          })
          .sort((a, b) => {
            const dateA = new Date(a.dato_Tid || a.datoTid || a.timestamp || a.date);
            const dateB = new Date(b.dato_Tid || b.datoTid || b.timestamp || b.date);
            return dateB - dateA; // Newest first
          });
        
        console.log('Filtered sensor logs:', sensorLogs);
        
        if (sensorLogs.length > 0) {
          // Get the latest sensor reading
          const latestLog = sensorLogs[0];
          console.log('Using latest sensor log:', latestLog);
          
          // Try to extract values using various possible field names
          this.moisture = latestLog.waterLevel || latestLog.water_Level || this.moisture;
          this.humidity = latestLog.airHumidityLevel || latestLog.air_Humidity_Level || this.humidity;
          this.temperature = latestLog.temperatureLevel || latestLog.temperature_Level || this.temperature;
          
          // If we can't find values directly, check if they're in a message or action field
          if (this.moisture === 0 || this.humidity === 0 || this.temperature === 0) {
            const actionText = latestLog.action || '';
            if (actionText.includes('Temp:') && actionText.includes('Moisture:') && actionText.includes('Humidity:')) {
              // Parse values from the action text (e.g., "Temp: 23.90°C, Moisture: 79.00%, Humidity: 42.00%")
              try {
                const tempMatch = actionText.match(/Temp: ([\d.]+)°C/);
                const moistureMatch = actionText.match(/Moisture: ([\d.]+)%/);
                const humidityMatch = actionText.match(/Humidity: ([\d.]+)%/);
                
                if (tempMatch) this.temperature = parseFloat(tempMatch[1]);
                if (moistureMatch) this.moisture = parseFloat(moistureMatch[1]);
                if (humidityMatch) this.humidity = parseFloat(humidityMatch[1]);
                
                console.log('Extracted values from action text:', {
                  temperature: this.temperature,
                  moisture: this.moisture,
                  humidity: this.humidity
                });
              } catch (parseErr) {
                console.error('Error parsing sensor values from action text:', parseErr);
              }
            }
          }
          
          console.log('Set sensor values:', { 
            moisture: this.moisture, 
            humidity: this.humidity, 
            temperature: this.temperature 
          });
        }
        
        // Also check for watering events
        const wateringEvents = historyRes.data
          .filter(log => {
            const lightLevel = log.lightLevel || log.light_Level;
            const logAction = log.action || log.Action || '';
            return lightLevel === 1 || logAction.includes('watered');
          })
          .sort((a, b) => {
            const dateA = new Date(a.dato_Tid || a.datoTid || a.timestamp || a.date);
            const dateB = new Date(b.dato_Tid || b.datoTid || b.timestamp || b.date);
            return dateB - dateA;
          });
        
        if (wateringEvents.length > 0) {
          const lastWatered = wateringEvents[0];
          const timestamp = lastWatered.dato_Tid || lastWatered.datoTid || 
                          lastWatered.timestamp || lastWatered.date;
          if (timestamp) {
            this.lastWatered = new Date(timestamp).toLocaleString();
            console.log('Updated last watered time:', this.lastWatered);
          }
        }
      }
    } catch (err) {
      console.error('Error loading sensor data from history:', err);
    }
    
    // Next try loading data from recent activity history directly to grab values from visible text
    try {
      await this.loadHistory();
      
      // Check if we have any sensor readings in recent activity
      const sensorEntries = this.history.filter(entry => 
        entry.action && entry.action.includes('Temp:') && 
        entry.action.includes('Moisture:') && 
        entry.action.includes('Humidity:')
      );
      
      if (sensorEntries.length > 0) {
        const latestEntry = sensorEntries[0];
        console.log('Found sensor entry in history:', latestEntry);
        
        try {
          // Parse values from the text (e.g., "Temp: 23.90°C, Moisture: 79.00%, Humidity: 42.00%")
          const tempMatch = latestEntry.action.match(/Temp: ([\d.]+)°C/);
          const moistureMatch = latestEntry.action.match(/Moisture: ([\d.]+)%/);
          const humidityMatch = latestEntry.action.match(/Humidity: ([\d.]+)%/);
          
          if (tempMatch) this.temperature = parseFloat(tempMatch[1]);
          if (moistureMatch) this.moisture = parseFloat(moistureMatch[1]);
          if (humidityMatch) this.humidity = parseFloat(humidityMatch[1]);
          
          console.log('Updated sensor values from history text:', {
            temperature: this.temperature,
            moisture: this.moisture,
            humidity: this.humidity
          });
        } catch (parseErr) {
          console.error('Error parsing sensor values from history text:', parseErr);
        }
      }
      
      // Also look for watering events
      const wateringEntries = this.history.filter(entry => 
        entry.action && entry.action.includes('watered')
      );
      
      if (wateringEntries.length > 0) {
        this.lastWatered = new Date(wateringEntries[0].timestamp).toLocaleString();
      }
    } catch (err) {
      console.error('Error processing history for sensor values:', err);
    }
    
    // Finally, try the API as a fallback
    try {
      await this.fetchStatus();
    } catch (err) {
      console.error('Error in fetchStatus:', err);
    }
    
    // Store initial sensor values to check during refreshes
    const initialValues = {
      moisture: this.moisture,
      humidity: this.humidity,
      temperature: this.temperature
    };
    
    // Flag to track if we have real values vs defaults
    let hasRealSensorData = this.moisture !== 50 || this.humidity !== 50 || this.temperature !== 50;
    
    // Set up auto-refresh, but don't let it override real sensor values with defaults
    this.refreshInterval = setInterval(async () => {
      console.log('Running refresh interval');
      
      // Before refreshing, check if we have real values
      if (hasRealSensorData) {
        console.log('Real sensor data detected, preserving values during refresh');
        
        // Only refresh history and non-sensor data
        try {
          await this.loadHistory();
        } catch (err) {
          console.error('Error refreshing history:', err);
        }
      } else {
        // We don't have real sensor data yet, try to get it
        await this.fetchStatus();
        
        // Check if we got real values in this refresh
        hasRealSensorData = this.moisture !== 50 || this.humidity !== 50 || this.temperature !== 50;
        
        // If we got real values, update initialValues
        if (hasRealSensorData) {
          initialValues.moisture = this.moisture;
          initialValues.humidity = this.humidity;
          initialValues.temperature = this.temperature;
          console.log('Real sensor data obtained during refresh, will preserve these values');
        } else {
          console.log('Still using default values after refresh');
        }
      }
    }, 30000);
  },
  beforeUnmount() {
    // Clear auto-refresh interval on component destroy
    clearInterval(this.refreshInterval);
  },
};
</script>

<style scoped>
.dashboard-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
  position: relative;
}

.user-panel {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
  padding-top: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 50px;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  font-size: 1.5rem;
  margin-right: 0.8rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #1f2937;
}

.subscription {
  font-size: 0.8rem;
  color: #4b5563;
}

.title {
  text-align: center;
  margin-bottom: 2rem;
  color: #0f766e;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.card {
  background-color: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card h2 {
  margin: 0;
  color: #166534;
  font-size: 1.5rem;
  font-weight: 600;
}

.card h3 {
  color: #166534;
  font-size: 1.3rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.health-indicator {
  padding: 0.4rem 0.8rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
}

.health-excellent {
  background-color: #d1fae5;
  color: #065f46;
}

.health-good {
  background-color: #e9f6fd;
  color: #0369a1;
}

.health-fair {
  background-color: #fef3c7;
  color: #92400e;
}

.health-poor {
  background-color: #fee2e2;
  color: #b91c1c;
}

.readings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reading {
  display: flex;
  align-items: center;
}

.reading-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
  width: 2rem;
  text-align: center;
}

.reading-details {
  flex: 1;
}

.reading-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.2rem;
}

.reading-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.2rem;
}

.last-watered {
  font-size: 0.95rem;
}

.reading-bar {
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.reading-progress {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.moisture .reading-progress {
  background-color: #38bdf8;
}

.humidity .reading-progress {
  background-color: #818cf8;
}

.temperature .reading-progress {
  background-color: #fb923c;
}

.water-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #38bdf8, #0ea5e9);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.water-button:hover {
  background: linear-gradient(to right, #0ea5e9, #0284c7);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.button-icon {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.auto-mode-toggle {
  margin: 1.5rem 0;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.toggle-label input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 48px;
  height: 24px;
  background-color: #e5e7eb;
  border-radius: 12px;
  margin-right: 0.8rem;
  transition: 0.3s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

input:checked + .toggle-slider {
  background-color: #16a34a;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-text {
  font-size: 0.95rem;
  color: #4b5563;
  font-weight: 500;
  transition: color 0.3s;
}

input:checked ~ .toggle-text {
  color: #16a34a;
}

.message {
  padding: 0.8rem;
  margin-top: 1rem;
  border-radius: 8px;
  text-align: center;
  background-color: #f3f4f6;
  color: #4b5563;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message.active {
  opacity: 1;
}

.history-card {
  margin-top: 1rem;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.history-item {
  display: flex;
  align-items: flex-start;
}

.history-time {
  font-size: 0.85rem;
  color: #6b7280;
  width: 60px;
  margin-right: 0.5rem;
}

.history-date {
  font-size: 0.85rem;
  color: #6b7280;
  width: 80px;
  margin-right: 1rem;
}

.history-content {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0.8rem;
  background-color: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #22c55e;
}

.history-icon {
  margin-right: 0.8rem;
  font-size: 1.2rem;
}

.history-text {
  font-size: 0.9rem;
  color: #4b5563;
}

/* Responsive design for mobile */
@media screen and (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .readings {
    display: flex;
    flex-direction: column;
  }
  
  .reading {
    margin-bottom: 1.2rem;
  }
  
  .user-info {
    padding: 0.4rem 0.8rem;
  }
  
  .user-avatar {
    font-size: 1.2rem;
  }
  
  .title {
    font-size: 1.5rem;
    margin-top: 3rem; /* Add space for fixed navbar */
    margin-bottom: 1.5rem;
  }
  
  .card h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
  
  .card h3 {
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
  }
  
  .dashboard-container {
    padding-top: 3.5rem; /* Add padding at the top to account for fixed navbar */
  }
}

@media screen and (max-width: 480px) {
  .dashboard-container {
    padding: 0.8rem;
    padding-top: 4rem; /* Increase padding for smaller screens */
  }
  
  .title {
    font-size: 1.3rem;
    margin-top: 0;
    text-align: center;
    width: 100%;
    display: block;
  }
  
  .card {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .card h2 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    width: 100%;
    text-align: left;
    display: block;
  }
  
  .card h3 {
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
    width: 100%;
    display: block;
    font-weight: 600;
  }
  
  .health-indicator {
    align-self: flex-start;
    margin-bottom: 0.5rem;
  }
  
  .user-panel {
    margin-bottom: 1rem;
    padding-top: 0.5rem;
  }
  
  .user-info {
    width: 100%;
    justify-content: center;
  }
  
  .reading {
    margin-bottom: 1.5rem; /* Increase spacing between readings */
  }
  
  .reading-label {
    font-size: 0.9rem;
  }
  
  .reading-value {
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  /* Make all section titles visible */
  .history-card h2,
  .actions-card h2,
  .status-card h2,
  .subscription-management h3 {
    margin-bottom: 1rem;
    display: block;
    width: 100%;
    font-weight: 600;
  }
}

.subscription-management {
  margin-top: 1.5rem;
}

.current-plan {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.plan-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-right: 0.5rem;
}

.plan-details {
  font-size: 0.9rem;
  color: #6b7280;
}

.upgrade-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.8rem;
  margin-top: 1rem;
  background: linear-gradient(to right, #38bdf8, #0ea5e9);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.upgrade-button:hover {
  background: linear-gradient(to right, #0ea5e9, #0284c7);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-container {
  background-color: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 80%;
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-content {
  margin-bottom: 1.5rem;
}

.subscription-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.subscription-card {
  background-color: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.subscription-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plan-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.plan-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.plan-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.plan-price {
  font-size: 0.9rem;
  color: #6b7280;
}

.plan-select {
  margin-top: 0.5rem;
}

.plan-select input {
  margin-right: 0.5rem;
}

.current-tag {
  padding: 0.2rem 0.4rem;
  border-radius: 50px;
  background-color: #d1fae5;
  color: #065f46;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.popular-badge {
  padding: 0.2rem 0.4rem;
  border-radius: 50px;
  background-color: #fef3c7;
  color: #92400e;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-button,
.confirm-button {
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background-color: #f3f4f6;
  color: #4b5563;
}

.confirm-button {
  background: linear-gradient(to right, #38bdf8, #0ea5e9);
  color: white;
}

.confirm-button:hover {
  background: linear-gradient(to right, #0ea5e9, #0284c7);
}

.plan-free {
  background-color: #f3f4f6;
  color: #4b5563;
}

.plan-silver {
  background-color: #e5e7eb;
  color: #374151;
}

.plan-gold {
  background-color: #fef3c7;
  color: #92400e;
}

.plan-platinum {
  background-color: #e0f2fe;
  color: #0369a1;
}

.plan-unknown {
  background-color: #f3f4f6;
  color: #4b5563;
}
</style>