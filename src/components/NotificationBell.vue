<template>
  <div class="notification-bell">
    <button class="bell-button" @click="toggleDropdown">
      <span class="icon">🔔</span>
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </button>
    
    <!-- Notification dropdown preview -->
    <div v-if="showDropdown" class="notification-dropdown">
      <div class="dropdown-header">
        <h3>Recent Notifications</h3>
        <button class="mark-all-button" @click.stop="markAllAsRead" v-if="notifications.length > 0">
          Mark all as read
        </button>
      </div>
      
      <div v-if="notifications.length === 0" class="empty-notifications">
        No new notifications
      </div>
      
      <div v-else class="notification-list">
        <div 
          v-for="notification in limitedNotifications" 
          :key="notification.notification_ID" 
          class="notification-item"
          :class="{ 
            'unread': !notification.isRead, 
            'warning-entry': isSeverity(notification, 'Warning'),
            'critical-entry': isSeverity(notification, 'Critical'),
            'normal-entry': (notification.type === 'Auto-water' || notification.type === 'Manual-water')
          }"
          @click="goToHistoryWithFilter(notification)"
        >
          <div class="notification-content">
            <div class="notification-header">
              <div class="notification-time">{{ formatTime(notification.dato_Tid) }}</div>
              <div class="notification-badges">
                <span class="sensor-reading-badge" v-if="notification.type === 'Moisture' || notification.type === 'Humidity' || notification.type === 'Temperature'">SENSOR READING</span>
                <span v-if="isSeverity(notification, 'Critical')" class="critical-badge">Critical state</span>
                <span v-else-if="isSeverity(notification, 'Warning')" class="warning-badge">Needs attention</span>
              </div>
            </div>
            <div class="notification-body">
              <div class="notification-icon">
                <span v-if="notification.type === 'Moisture'">💧</span>
                <span v-else-if="notification.type === 'Humidity'">💨</span>
                <span v-else-if="notification.type === 'Temperature'">🌡️</span>
                <span v-else-if="notification.type === 'Auto-water' || notification.type === 'Manual-water'">🌱</span>
                <span v-else>🔔</span>
              </div>
              <div class="notification-text">
                <p class="notification-message">{{ notification.message }}</p>
                <p class="notification-plant">{{ notification.plant?.plant_Name || 'Unknown plant' }}</p>
                <p v-if="hasSensorValues(notification)" class="notification-sensor-readings">
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
                </p>
              </div>
            </div>
          </div>
          <button 
            class="mark-read-button" 
            @click.stop="markAsReadAndRemove(notification.notification_ID)"
            v-if="!notification.isRead"
            aria-label="Mark as read"
          >
            ✓
          </button>
        </div>
        
        <div class="view-all" v-if="notifications.length > 3">
          <button @click.stop="goToNotifications" class="view-all-button">
            View all ({{ notifications.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getUnreadNotificationCount, getAllNotifications, markAsRead, markAllAsRead } from '@/services/NotificationService';

export default {
  name: 'NotificationBell',
  data() {
    return {
      unreadCount: 0,
      notifications: [],
      showDropdown: false,
      intervalId: null
    };
  },
  computed: {
    limitedNotifications() {
      return this.notifications.slice(0, 3);
    }
  },
  mounted() {
    // Initial fetch
    this.fetchNotifications();
    
    // Set up polling every 30 seconds
    this.intervalId = setInterval(() => {
      this.fetchNotifications();
    }, 30000);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', this.closeDropdown);
  },
  beforeUnmount() {
    // Clean up the interval when the component is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    document.removeEventListener('click', this.closeDropdown);
  },
  methods: {
    isSeverity(notification, severity) {
      // Check multiple possible locations of severity information
      return (notification.notificationType === severity) || 
             (notification.NotificationType === severity) ||
             (notification.message && notification.message.toLowerCase().includes(severity.toLowerCase())) ||
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
    fetchNotifications() {
      // Get unread count
      getUnreadNotificationCount()
        .then(count => {
          this.unreadCount = count;
          // Update page title if there are notifications
          if (count > 0) {
            document.title = `(${count}) PlantHomie`;
          } else {
            document.title = 'PlantHomie';
          }
        })
        .catch(error => {
          console.error('Failed to fetch notification count:', error);
        });
        
      // Get latest notifications for the dropdown
      getAllNotifications()
        .then(response => {
          if (response.data && Array.isArray(response.data)) {
            // Sort notifications by date (newest first) and show unread first
            const sortedNotifications = [...response.data].sort((a, b) => {
              // First sort by read status
              if (!a.isRead && b.isRead) return -1;
              if (a.isRead && !b.isRead) return 1;
              
              // Then by date
              const dateA = new Date(a.dato_Tid || a.timestamp);
              const dateB = new Date(b.dato_Tid || b.timestamp);
              return dateB - dateA;
            });
            
            // Process notifications to ensure they have severity information
            this.notifications = sortedNotifications.map(notification => {
              // Extract plant name if not already set
              if (!notification.plant && notification.message) {
                const nameMatch = notification.message.match(/^(Warning|Critical): ([^!]+) (is|has|needs)/i);
                if (nameMatch && nameMatch.length > 2) {
                  notification.plant = { plant_Name: nameMatch[2].trim() };
                }
              }
              
              // Determine notification type from message if not already set
              if (!notification.type) {
                if (notification.message?.toLowerCase().includes('moisture') || 
                    notification.message?.toLowerCase().includes('soil')) {
                  notification.type = 'Moisture';
                } else if (notification.message?.toLowerCase().includes('humidity')) {
                  notification.type = 'Humidity';
                } else if (notification.message?.toLowerCase().includes('temperature') || 
                          notification.message?.toLowerCase().includes('hot') || 
                          notification.message?.toLowerCase().includes('cold') ||
                          notification.message?.toLowerCase().includes('°c')) {
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
                if (notification.message?.toLowerCase().includes('critical')) {
                  notification.notificationType = 'Critical';
                } else if (notification.message?.toLowerCase().includes('warning')) {
                  notification.notificationType = 'Warning';
                } else if (notification.type === 'Temperature' || notification.type === 'Humidity' || notification.type === 'Moisture') {
                  // Check for critical keywords in the message
                  if ((notification.message?.toLowerCase().includes('critically')) || 
                      (notification.message?.toLowerCase().includes('immediately')) ||
                      (notification.message?.toLowerCase().includes('dangerously')) ||
                      (notification.message?.toLowerCase().includes('severely'))) {
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
        })
        .catch(error => {
          console.error('Failed to fetch notifications:', error);
        });
    },
    toggleDropdown(event) {
      event.stopPropagation();
      this.showDropdown = !this.showDropdown;
    },
    closeDropdown(event) {
      // Only close if click is outside the notification bell component
      if (!this.$el.contains(event.target)) {
        this.showDropdown = false;
      }
    },
    goToNotifications() {
      this.showDropdown = false;
      this.$router.push('/notifications');
    },
    goToHistoryWithFilter(notification) {
      this.showDropdown = false;
      
      // Navigate to history page with filter parameters
      const queryParams = {};
      
      // Add plant filter if available
      if (notification.plant_ID || notification.Plant_ID) {
        queryParams.plant = notification.plant_ID || notification.Plant_ID;
      }
      
      // Navigate to history with query parameters
      this.$router.push({ 
        path: '/history', 
        query: queryParams
      });
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString();
    },
    markAsReadAndRemove(id) {
      markAsRead(id)
        .then(() => {
          // Update notification in the list
          const notification = this.notifications.find(n => n.notification_ID === id);
          if (notification) {
            notification.isRead = true;
          }
          
          // Reduce unread count
          if (this.unreadCount > 0) {
            this.unreadCount--;
          }
          
          // Update document title
          if (this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) PlantHomie`;
          } else {
            document.title = 'PlantHomie';
          }
        })
        .catch(error => {
          console.error('Failed to mark notification as read:', error);
        });
    },
    markAllAsRead() {
      markAllAsRead()
        .then(() => {
          // Update all notifications in the list
          this.notifications.forEach(notification => {
            notification.isRead = true;
          });
          
          // Reset unread count
          this.unreadCount = 0;
          document.title = 'PlantHomie';
          
          // Refresh notifications from server to ensure consistency
          this.fetchNotifications();
        })
        .catch(error => {
          console.error('Failed to mark all notifications as read:', error);
        });
    }
  }
};
</script>

<style scoped>
.notification-bell {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.bell-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.icon {
  font-size: 1.5rem;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ff4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 340px;
  max-width: 90vw;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.mark-all-button {
  border: none;
  background: none;
  color: #16a34a;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 3px 5px;
}

.mark-all-button:hover {
  text-decoration: underline;
}

.empty-notifications {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.notification-list {
  max-height: 450px;
  overflow-y: auto;
}

.notification-item {
  padding: 10px 15px;
  border-bottom: 1px solid #e9ecef;
  position: relative;
  transition: background-color 0.2s;
  cursor: pointer;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f7ff;
}

.notification-item.unread:hover {
  background-color: #e6f2ff;
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

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-time {
  color: #6c757d;
  font-size: 0.8rem;
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

.critical-badge, .warning-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
}

.critical-badge {
  background-color: #ffebee;
  color: #d32f2f;
}

.warning-badge {
  background-color: #fff8e1;
  color: #ff8f00;
}

.notification-body {
  display: flex;
  align-items: flex-start;
}

.notification-icon {
  margin-right: 10px;
  font-size: 1.2rem;
  min-width: 24px;
}

.notification-text {
  flex: 1;
}

.notification-message {
  margin: 0 0 4px;
  font-size: 14px;
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

.mark-read-button {
  background: none;
  border: none;
  color: #16a34a;
  cursor: pointer;
  font-size: 1rem;
  padding: 3px;
  margin-left: 5px;
  display: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 10px;
  right: 10px;
}

.notification-item:hover .mark-read-button {
  display: flex;
}

.mark-read-button:hover {
  background-color: rgba(22, 163, 74, 0.1);
}

.view-all {
  padding: 10px;
  text-align: center;
  border-top: 1px solid #e9ecef;
}

.view-all-button {
  background: none;
  border: none;
  color: #16a34a;
  cursor: pointer;
  padding: 5px;
  width: 100%;
  font-size: 0.9rem;
}

.view-all-button:hover {
  text-decoration: underline;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .notification-dropdown {
    position: fixed;
    top: 60px;
    left: 10px;
    right: 10px;
    width: auto;
  }
}
</style> 