<template>
  <div>
    <button 
      @click="sendTestNotification" 
      class="btn"
      :class="{ 'btn-primary': !testStatus, 'btn-success': testStatus === 'success', 'btn-danger': testStatus === 'error' }"
      :disabled="loading"
    >
      <span v-if="loading">Testing...</span>
      <span v-else>{{ buttonText }}</span>
    </button>
    
    <div v-if="result" class="mt-2 notification-result">
      <div v-if="testStatus === 'success'" class="alert alert-success">
        <strong>Success!</strong> Notification created.
        <div v-if="result.data && result.data.notification">
          <small>ID: {{ result.data.notification.notification_ID }}</small>
        </div>
      </div>
      <div v-if="testStatus === 'error'" class="alert alert-danger">
        <strong>Error:</strong> {{ result.error }}
        <div v-if="result.details">
          <small>{{ JSON.stringify(result.details) }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { testNotification } from '@/services/NotificationService';
import { API, apiConfig } from '@/services/api';

export default {
  name: 'TestNotificationButton',
  props: {
    plantId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      testStatus: null, // 'success', 'error', or null
      result: null,
      buttonText: 'Create Test Notification'
    };
  },
  methods: {
    async sendTestNotification() {
      this.loading = true;
      this.testStatus = null;
      this.result = null;
      
      try {
        // Show full API configuration for debugging
        console.log('API Configuration:', {
          baseURL: API.defaults.baseURL,
          testMode: apiConfig.testMode,
          debugMode: apiConfig.debugMode
        });
        
        const result = await testNotification(this.plantId);
        console.log('Test result:', result);
        
        this.result = result;
        this.testStatus = result.success ? 'success' : 'error';
        this.buttonText = result.success ? 'Test Successful' : 'Test Failed';
        
        // Reset button text after 3 seconds
        setTimeout(() => {
          this.buttonText = 'Create Test Notification';
        }, 3000);
      } catch (error) {
        console.error('Error testing notification:', error);
        this.result = { 
          success: false, 
          error: error.message || 'Unknown error occurred' 
        };
        this.testStatus = 'error';
        this.buttonText = 'Test Failed';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.notification-result {
  max-width: 500px;
}
</style> 