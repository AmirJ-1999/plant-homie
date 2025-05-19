<template>
  <div class="login-page">
    <div class="nature-background"></div>
    
    <div class="login-container">
      <div class="logo-container">
        <div class="sun-character">
          <div class="sun-face"></div>
          <div class="plant-pot"></div>
        </div>
        <h1 class="logo">🌿 Plant Homie</h1>
        <p class="tagline">Your plant's best friend</p>
      </div>

      <div class="login-card">
        <h2>Welcome Back</h2>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-container">
              <span class="input-icon">👤</span>
              <input id="username" v-model="username" placeholder="Enter your username" required />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-container">
              <span class="input-icon">🔒</span>
              <input id="password" type="password" v-model="password" placeholder="Enter your password" required />
            </div>
          </div>

          <button type="submit" class="login-button">
            <span class="button-text">Login</span>
            <span class="button-icon">→</span>
          </button>
        </form>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        
        <div class="divider">
          <span>OR</span>
        </div>
        
        <p class="signup-text">
          Don't have an account?
          <router-link to="/signup" class="signup-link">Sign up here</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { login, getUserData } from '@/services/UserService';

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    async handleLogin() {
      this.errorMessage = '';
      console.log('Login attempt with username:', this.username);

      try {
        console.log('Sending login request...');
        const response = await login({
          username: this.username,
          password: this.password
        });
        
        console.log('Login successful, response:', response.data);

        // Gem token og rolle
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('role', response.data.role ?? 'user');
        sessionStorage.setItem('userId', response.data.userId);
        
        // Gem brugernavn
        sessionStorage.setItem('username', this.username);
        
        // Gem subscription direkte fra login-svaret
        if (response.data.subscription) {
          console.log('Setting subscription from login response:', response.data.subscription);
          sessionStorage.setItem('subscription', response.data.subscription);
        } else {
          try {
            // Prøv at få abonnement fra brugerdata
            console.log('Fetching user data for subscription info...');
            const userData = await getUserData(this.username);
            if (userData && userData.subscription) {
              console.log('Setting subscription from user data:', userData.subscription);
              sessionStorage.setItem('subscription', userData.subscription);
            } else {
              // Tjek om vi har et abonnement fra tilmelding
              const tempSubscription = sessionStorage.getItem('tempSubscription');
              if (tempSubscription) {
                console.log('Setting subscription from temp storage:', tempSubscription);
                sessionStorage.setItem('subscription', tempSubscription);
                sessionStorage.removeItem('tempSubscription'); // Ryd op
              } else {
                console.log('Setting default Free subscription');
                sessionStorage.setItem('subscription', 'Free');
              }
            }
          } catch (err) {
            console.error('Could not fetch user details:', err);
            // Brug midlertidig abonnement eller standard
            const tempSubscription = sessionStorage.getItem('tempSubscription');
            sessionStorage.setItem('subscription', tempSubscription || 'Free');
            sessionStorage.removeItem('tempSubscription'); // Ryd op
          }
        }

        console.log('Login complete, navigating to dashboard...');
        // Naviger til dashboard
        this.$router.push('/dashboard');
      } catch (err) {
        console.error('Login error:', err);
        
        if (err.response) {
          console.error('Error status:', err.response.status);
          console.error('Error data:', err.response.data);
          
          if (typeof err.response.data === 'object' && err.response.data.message) {
            this.errorMessage = err.response.data.message;
          } else if (typeof err.response.data === 'string') {
            this.errorMessage = err.response.data;
          } else {
            this.errorMessage = `Login failed (${err.response.status})`;
          }
        } else if (err.request) {
          console.error('No response received:', err.request);
          this.errorMessage = 'Server did not respond. Please try again later.';
        } else {
          console.error('Error setting up request:', err.message);
          this.errorMessage = err.message || 'An error occurred during login';
        }
      }
    }
  }
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.nature-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, #87CEEB, #e0f7fa);
  z-index: -2;
}

.nature-background::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 25%;
  background-image: linear-gradient(to top, #4ade80, transparent);
  z-index: -1;
}

.nature-background::after {
  content: '';
  position: absolute;
  top: 15%;
  right: 10%;
  width: 100px;
  height: 100px;
  background: #FFD700;
  border-radius: 50%;
  box-shadow: 0 0 60px 20px rgba(255, 215, 0, 0.7);
  z-index: -1;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1000px;
  z-index: 1;
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.sun-character {
  position: relative;
  width: 120px;
  height: 180px;
  margin: 0 auto 1rem;
}

.sun-face {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 100px;
  background-color: #FFD700;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.sun-face::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 25px;
  width: 10px;
  height: 10px;
  background-color: #000;
  border-radius: 50%;
}

.sun-face::after {
  content: '';
  position: absolute;
  top: 30px;
  right: 25px;
  width: 10px;
  height: 10px;
  background-color: #000;
  border-radius: 50%;
}

.plant-pot {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 70px;
  background-color: #8B4513;
  border-radius: 5px 5px 35px 35px;
}

.plant-pot::before {
  content: '';
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 40px;
  background-color: #228B22;
}

.plant-pot::after {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 20px;
  background-color: #32CD32;
  border-radius: 50% 50% 0 0;
}

.logo {
  font-size: 2.5rem;
  color: #166534;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tagline {
  font-size: 1.2rem;
  color: #166534;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.login-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.login-card h2 {
  font-size: 1.8rem;
  color: #166534;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 15px;
  font-size: 1.2rem;
}

input {
  width: 100%;
  padding: 0.8rem 0.8rem 0.8rem 3rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

input:focus {
  outline: none;
  border-color: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.25);
}

input::placeholder {
  color: #9ca3af;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.9rem;
  margin-top: 1rem;
  background: linear-gradient(to right, #22c55e, #16a34a);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-text {
  margin-right: 0.5rem;
}

.button-icon {
  font-size: 1.2rem;
}

.error {
  margin-top: 1rem;
  padding: 0.8rem;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  font-size: 0.95rem;
  text-align: center;
}

.divider {
  position: relative;
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: #e5e7eb;
}

.divider span {
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.signup-text {
  text-align: center;
  font-size: 1rem;
  color: #4b5563;
}

.signup-link {
  color: #16a34a;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.signup-link:hover {
  color: #166534;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .login-card {
    padding: 2rem;
    max-width: 90%;
  }
  
  .logo {
    font-size: 2rem;
  }
  
  .tagline {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
  
  .login-button {
    padding: 0.8rem;
  }
}
</style>