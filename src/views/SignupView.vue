<template>
  <div class="signup-page">
    <div class="nature-background"></div>
    
    <div class="signup-container">
      <div class="logo-container">
        <div class="plant-icon">🌱</div>
        <h1 class="logo">Create a New Account</h1>
        <p class="tagline">Join our community of plant lovers</p>
      </div>

      <div class="signup-card">
    <!-- ---------- FORM ---------- -->
    <form @submit.prevent="handleSignup">
      <!-- Username -->
      <div class="form-group">
            <label for="username">Username</label>
            <div class="input-container">
              <span class="input-icon">👤</span>
              <input id="username" type="text" v-model="username" placeholder="16-17 characters" required />
            </div>
            <div class="requirements">Must be 16-17 characters long</div>
      </div>

      <!-- Password -->
      <div class="form-group">
            <label for="password">Password</label>
            <div class="input-container">
              <span class="input-icon">🔒</span>
              <input id="password" type="password" v-model="password" placeholder="10-20 characters with mixed types" required />
            </div>
            <div class="requirements">10-20 characters with uppercase, lowercase, numbers and special characters</div>
      </div>

      <!-- Subscription -->
          <div class="form-group subscription-group">
            <label>Choose Your Plan</label>
            
            <div class="subscription-options">
              <div class="subscription-card" :class="{ 'selected': selectedPlan === 'Free' }" @click="selectedPlan = 'Free'">
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
                  <input type="radio" id="plan-free" name="plan" value="Free" v-model="selectedPlan" />
                  <label for="plan-free">Select</label>
                </div>
              </div>
              
              <div class="subscription-card" :class="{ 'selected': selectedPlan === 'Premium_Silver' }" @click="selectedPlan = 'Premium_Silver'">
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
                  <input type="radio" id="plan-silver" name="plan" value="Premium_Silver" v-model="selectedPlan" />
                  <label for="plan-silver">Select</label>
                </div>
              </div>
              
              <div class="subscription-card" :class="{ 'selected': selectedPlan === 'Premium_Gold' }" @click="selectedPlan = 'Premium_Gold'">
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
                  <input type="radio" id="plan-gold" name="plan" value="Premium_Gold" v-model="selectedPlan" />
                  <label for="plan-gold">Select</label>
                </div>
      </div>

              <div class="subscription-card" :class="{ 'selected': selectedPlan === 'Premium_Plat' }" @click="selectedPlan = 'Premium_Plat'">
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
                  <input type="radio" id="plan-platinum" name="plan" value="Premium_Plat" v-model="selectedPlan" />
                  <label for="plan-platinum">Select</label>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" class="signup-button">
            <span class="button-text">Create Account</span>
            <span class="button-icon">✓</span>
          </button>
    </form>

        <!-- ---------- MESSAGE ---------- -->
    <p v-if="message" :class="ok ? 'info-ok' : 'info-err'">{{ message }}</p>

        <div class="divider">
          <span>OR</span>
        </div>

    <p class="login-text">
      Already have an account?
          <router-link to="/login" class="login-link">Log in here</router-link>
    </p>
      </div>
    </div>
  </div>
</template>

<script>
import { signup } from '@/services/UserService';

export default {
  name: 'SignupView',
  data() {
    return {
      username    : '',
      password    : '',
      selectedPlan: 'Free',
      message     : '',
      ok          : false
    };
  },

  /* Hjælpefunktioner til validering */
  methods: {
    validUsername(u) {
      return u.length >= 16 && u.length <= 17 && !u.includes('@');
    },
    validPassword(pw) {
      if (pw.length < 10 || pw.length > 20) return false;
      return /[A-Z]/.test(pw) && /[a-z]/.test(pw) &&
             /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
    },

    /* Håndtering af selve oprettelsen */
    async handleSignup() {
      /* Først, lidt tjek af input her i frontend */
      if (!this.validUsername(this.username)) {
        this.ok = false;
        this.message =
          '❌ Username must be 16-17 characters and cannot be an email.';
        return;
      }
      if (!this.validPassword(this.password)) {
        this.ok = false;
        this.message =
          '❌ Password must be 10-20 characters and contain uppercase/lowercase letters, numbers and special characters.';
        return;
      }

      try {
        await signup({
          username: this.username,
          password: this.password,
          plan    : this.selectedPlan
        });

        // Gemmer den valgte plan midlertidigt, så login-siden kan samle den op
        sessionStorage.setItem('tempSubscription', this.selectedPlan);

        this.ok      = true;
        this.message = '✅ Account created successfully! Redirecting to login...';
        setTimeout(() => this.$router.push('/login'), 1200);
      } catch (err) {
        this.ok      = false;
        this.message =
          err.response?.data ?? '❌ Could not create user (server error).';
      }
    }
  }
};
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow-x: hidden;
  padding: 3rem 1rem;
}

.nature-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, #e0f7fa, #b2ebf2);
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

.signup-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  z-index: 1;
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.plant-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.logo {
  font-size: 2.2rem;
  color: #166534;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tagline {
  font-size: 1.2rem;
  color: #166534;
  opacity: 0.9;
}

.signup-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 900px;
  border: 1px solid rgba(255, 255, 255, 0.5);
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

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 0.8rem 0.8rem 0.8rem 3rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

input[type="text"]:focus,
input[type="password"]:focus {
  outline: none;
  border-color: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.25);
}

input::placeholder {
  color: #9ca3af;
}

.requirements {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.subscription-group {
  margin-top: 2rem;
}

.subscription-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.subscription-card {
  position: relative;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.8);
}

.subscription-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.subscription-card.selected {
  border-color: #4ade80;
  background-color: rgba(240, 253, 244, 0.8);
}

.popular-badge {
  position: absolute;
  top: -10px;
  right: 10px;
  background: #f59e0b;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
}

.plan-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.plan-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.plan-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.plan-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #166534;
  margin-bottom: 1rem;
}

.price-period {
  font-size: 0.9rem;
  font-weight: normal;
  color: #6b7280;
}

.plan-features {
  list-style-type: none;
  padding: 0;
  margin: 0 0 1.5rem;
}

.plan-features li {
  padding: 0.4rem 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.plan-features li::before {
  content: "✓";
  color: #16a34a;
  margin-right: 0.5rem;
  font-weight: bold;
}

.plan-select {
  text-align: center;
}

.plan-select input[type="radio"] {
  display: none;
}

.plan-select label {
  display: inline-block;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  background-color: #f3f4f6;
  color: #6b7280;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.selected .plan-select label {
  background-color: #16a34a;
  color: white;
}

.signup-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.9rem;
  margin-top: 2rem;
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

.signup-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-text {
  margin-right: 0.5rem;
}

.button-icon {
  font-size: 1.2rem;
}

.info-ok {
  margin-top: 1.5rem;
  padding: 0.8rem;
  background-color: #d1fae5;
  color: #065f46;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
}

.info-err {
  margin-top: 1.5rem;
  padding: 0.8rem;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  font-weight: 500;
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

.login-text {
  text-align: center;
  font-size: 1rem;
  color: #4b5563;
}

.login-link {
  color: #16a34a;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.login-link:hover {
  color: #166534;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .signup-card {
    padding: 2rem;
    max-width: 95%;
  }
  
  .subscription-options {
    grid-template-columns: 1fr;
  }
  
  .logo {
    font-size: 1.8rem;
  }
  
  .tagline {
    font-size: 1rem;
  }
}
</style>
