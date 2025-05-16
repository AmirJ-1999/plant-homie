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
            <input type="checkbox" v-model="autoMode" @change="toggleAutoMode" />
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
            <div class="history-icon">📊</div>
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
import { API, baseURL } from '@/services/api';

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
      showUpgradeModal: false,
      selectedPlan: 'Free',
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
        
        // Brugerinfo hentes fra sessionStorage i stedet for et API-kald her
        this.username = sessionStorage.getItem('username') || 'Unknown';
        this.subscription = sessionStorage.getItem('subscription') || 'Free';
        this.lastWatered = new Date().toLocaleString();
        
        // Henter auto-vandingsstatus fra localStorage (den er lidt mere persistent end sessionStorage)
        const savedAutoMode = localStorage.getItem('autoWaterMode');
        if (savedAutoMode !== null) {
          this.autoMode = savedAutoMode === 'true';
          console.log('Auto-water mode initialized to:', this.autoMode);
        }
        
        // Tjekkers også lige den seneste auto-vandingsstatus fra historikken
        try {
          const historyRes = await API.get(`${baseURL}/plantlog?limit=5`);
          if (Array.isArray(historyRes.data) && historyRes.data.length > 0) {
            // Leder efter den nyeste hændelse for auto-vanding
            const autoEvents = historyRes.data.filter(log => {
              const lightLevel = log.lightLevel || log.light_Level;
              return lightLevel === 999 || lightLevel === 0;
            });
            
            if (autoEvents.length > 0) {
              // Sorterers, så den nyeste kommer først
              autoEvents.sort((a, b) => {
                const dateA = new Date(a.dato_Tid || a.datoTid || a.timestamp || a.date);
                const dateB = new Date(b.dato_Tid || b.datoTid || b.timestamp || b.date);
                return dateB - dateA;
              });
              
              // Snup den allernyeste status
              const mostRecent = autoEvents[0];
              const lightLevel = mostRecent.lightLevel || mostRecent.light_Level;
              const serverAutoMode = lightLevel === 999;
              
              // Hvis serverens status er anderledes end den i localStorage, så er det serveren, der bestemmer
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
        console.error('Could not fetch user data:', err);
        this.username = 'Unknown';
        this.subscription = 'Unknown';
      }
    },
    async fetchStatus() {
      try {
        const [moistureRes, humidityRes, tempRes] = await Promise.all([
          API.get(`${baseURL}/plantlog/soilmoisture/1`),
          API.get(`${baseURL}/plantlog/airhumidity/1`),
          API.get(`${baseURL}/plantlog/temperature/1`)
        ]);

        this.moisture = typeof moistureRes.data === 'number' ? moistureRes.data : moistureRes.data.moisture ?? 0;
        this.humidity = typeof humidityRes.data === 'number' ? humidityRes.data : humidityRes.data.humidity ?? 0;
        this.temperature = typeof tempRes.data === 'number' ? tempRes.data : tempRes.data.temperature ?? 0;

        this.lastWatered = new Date().toLocaleString();
        
        // Indlæs automatisk vandingstilstand fra localStorage (mere vedvarende end sessionStorage)
        const savedAutoMode = localStorage.getItem('autoWaterMode');
        if (savedAutoMode !== null) {
          this.autoMode = savedAutoMode === 'true';
          console.log('Auto-water mode initialized to:', this.autoMode);
        }
        
        // Prøv også at kontrollere den seneste auto-vandings tilstand fra historikken
        try {
          const historyRes = await API.get(`${baseURL}/plantlog?limit=5`);
          if (Array.isArray(historyRes.data) && historyRes.data.length > 0) {
            // Søg efter den seneste auto-vandings begivenhed
            const autoEvents = historyRes.data.filter(log => {
              const lightLevel = log.lightLevel || log.light_Level;
              return lightLevel === 999 || lightLevel === 0;
            });
            
            if (autoEvents.length > 0) {
              // Sorter efter dato, nyeste først
              autoEvents.sort((a, b) => {
                const dateA = new Date(a.dato_Tid || a.datoTid || a.timestamp || a.date);
                const dateB = new Date(b.dato_Tid || b.datoTid || b.timestamp || b.date);
                return dateB - dateA;
              });
              
              // Få den seneste tilstand
              const mostRecent = autoEvents[0];
              const lightLevel = mostRecent.lightLevel || mostRecent.light_Level;
              const serverAutoMode = lightLevel === 999;
              
              // Hvis servertilstanden er forskellig fra localStorage, brug servertilstanden
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
        console.error('Could not fetch status from Azure:', err);
      }
    },
    waterPlant() {
      this.message = 'Watering your plant...';
      setTimeout(() => {
        this.message = 'Plant watered successfully!';
        this.lastWatered = new Date().toLocaleString();
        this.history.unshift({
          id: Date.now(),
          timestamp: new Date(),
          action: 'Plant watered manually'
        });
        
        // Ryd meddelelse efter 3 sekunder
        setTimeout(() => {
          this.message = '';
        }, 3000);
      }, 1000);
    },
    toggleAutoMode() {
      // Slår automatisk vanding til eller fra
      this.autoMode = !this.autoMode;
      
      // Gemmer den nye status i localStorage
      localStorage.setItem('autoWaterMode', this.autoMode.toString());
      
      // Viser en passende besked til brugeren
      this.message = this.autoMode ? 'Auto-mode enabled' : 'Auto-mode disabled';
      
      // Føjer hændelsen til historikken
      this.history.unshift({
        id: Date.now(),
        timestamp: new Date(),
        action: this.autoMode ? 'Auto-watering mode enabled' : 'Auto-watering mode disabled'
      });
      
      // Sender også den nye status til backend, så den bliver gemt der
      this.saveAutoModeEvent(this.autoMode);
      
      // Ryd meddelelse efter 3 sekunder
      setTimeout(() => {
        this.message = '';
      }, 3000);
    },
    // En ny metode specifikt til at gemme auto-vandingshændelser på serveren
    async saveAutoModeEvent(isEnabled) {
      try {
        // Forbereder en PlantLog-post for ændringen i auto-vanding
        const eventData = {
          Plant_ID: 1, // Går ud fra, at det er plante nr. 1, vi arbejder med her
          TemperatureLevel: this.temperature,
          WaterLevel: this.moisture,
          AirHumidityLevel: this.humidity,
          // Dobbelttjekker, at serveren kan genkende dette feltnavn
          LightLevel: isEnabled ? 999 : 0, // Bruger LightLevel som et smart flag (999 for aktiv, 0 for inaktiv)
          Light_Level: isEnabled ? 999 : 0  // Har et backup-felt med, hvis API'en nu skulle foretrække snake_case
        };
        
        // Sender data til plantlog-endepunktet
        const response = await API.post(`${baseURL}/plantlog`, eventData);
        
        if (response.status === 200 || response.status === 201) {
          console.log('Auto-water mode event saved successfully:', isEnabled ? 'enabled' : 'disabled');
        }
      } catch (err) {
        console.error('Could not save auto-mode event to backend:', err);
      }
    },
    async loadHistory() {
      try {
        const res = await API.get(`${baseURL}/plantlog`);
        if (Array.isArray(res.data)) {
          // Bearbejder data for at få auto-vandingshændelser med i oversigten
          this.history = res.data.map(log => {
            // Tager højde for, at API'en måske bruger lidt andre navne til felterne
            const lightLevel = log.lightLevel !== undefined ? log.lightLevel : log.light_Level;
            const timestamp = new Date(log.dato_Tid || log.datoTid || log.timestamp || log.date);
            const plantLogId = log.plantLog_ID || log.plantLogId || log.id;
            const temperature = log.temperatureLevel || log.temperature_Level;
            const moisture = log.waterLevel || log.water_Level;
            const humidity = log.airHumidityLevel || log.air_Humidity_Level;
            
            // (LightLevel er 999 eller 0)
            if (lightLevel === 999 || lightLevel === 0) {
              const isEnabled = lightLevel === 999;
              return {
                id: plantLogId,
                timestamp: timestamp,
                action: isEnabled ? 'Auto-watering mode enabled' : 'Auto-watering mode disabled'
              };
            } else {
              // Dette er en helt almindelig log med sensordata
              return {
                id: plantLogId,
                timestamp: timestamp,
                action: `Temp: ${temperature.toFixed(2)}°C, Moisture: ${moisture.toFixed(2)}%, Humidity: ${humidity.toFixed(2)}%`
              };
            }
          });
        } else {
          this.history = [];
        }
      } catch (err) {
        console.error('Could not fetch history from Azure:', err);
      }
    },
    changeSubscription() {
      this.message = 'Subscription change in progress...';
      setTimeout(() => {
        this.message = 'Subscription changed successfully!';
        this.subscription = this.selectedPlan;
        this.showUpgradeModal = false;
      }, 1000);
    },
  },
  mounted() {
    this.fetchUserInfo();
    this.fetchStatus();
    this.loadHistory();
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
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 50px;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  color: #374151;
}

.subscription {
  font-size: 0.85rem;
  color: #16a34a;
  font-weight: bold;
}

.title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #166534;
}

.grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(232, 245, 233, 0.8);
}

.card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card h2 {
  margin-bottom: 1.2rem;
  color: #166534;
  font-weight: 600;
  font-size: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
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
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
  
  .user-info {
    padding: 0.4rem 0.8rem;
  }
  
  .user-avatar {
    font-size: 1.2rem;
  }
  
  .title {
    font-size: 1.5rem;
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