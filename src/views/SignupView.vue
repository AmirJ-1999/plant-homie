<template>
  <div class="signup-page">
    <h1 class="logo">🌱 Create a New Account</h1>

    <form @submit.prevent="handleSignup">
      <div class="form-group">
        <label>Username:</label>
        <input v-model="username" required />
      </div>

      <div class="form-group">
        <label>Password:</label>
        <input type="password" v-model="password" required />
      </div>

      <div class="form-group">
        <label>Choose Subscription:</label>
        <select v-model="selectedPlan" required>
          <option value="Free">Freeplan (10 plants, weekly password change required)</option>
          <option value="Premium_Silver">Premium Silver (30 plants, weekly password change required)</option>
          <option value="Premium_Gold">Premium Gold (50 plants, weekly password change required)</option>
          <option value="Premium_Plat">Premium Plat (100 plants, no password change required)</option>
        </select>
      </div>

      <button type="submit" class="signup-button">Sign Up</button>
    </form>

    <p v-if="message" :class="ok ? 'info-ok' : 'info-err'">{{ message }}</p>

    <p class="login-text">
      Already have an account? <router-link to="/login">Log in here</router-link>
    </p>
  </div>
</template>

<script>
import { signup } from '@/services/UserService';

export default {
  name: 'SignupView',
  data() {
    return {
      username: '',
      password: '',
      selectedPlan: 'Free',
      message: '',
      ok: false
    };
  },
  methods: {
    async handleSignup() {
      /* ——— validering beholdt fra din gamle fil ——— */
      if (
        this.username.length < 16 ||
        this.username.length > 17 ||
        this.username.includes('@')
      ) {
        this.message =
          '❌ Brugernavn skal være 16-17 tegn og må ikke være en email.';
        this.ok = false;
        return;
      }

      if (this.password.length < 10 || this.password.length > 20) {
        this.message = '❌ Password skal være mellem 10 og 20 tegn.';
        this.ok = false;
        return;
      }

      const hasUpper   = /[A-Z]/.test(this.password);
      const hasLower   = /[a-z]/.test(this.password);
      const hasDigit   = /[0-9]/.test(this.password);
      const hasSpecial = /[^A-Za-z0-9]/.test(this.password);

      if (!(hasUpper && hasLower && hasDigit && hasSpecial)) {
        this.message =
          '❌ Password skal indeholde store/små bogstaver, tal og specialtegn.';
        this.ok = false;
        return;
      }

      /* ——— send til backend ——— */
      try {
        await signup({
          username: this.username,
          password: this.password,
          plan    : this.selectedPlan
        });

        this.ok      = true;
        this.message = '✅ Konto oprettet! Du kan nu logge ind.';
        // Redirect efter 1 sek.
        setTimeout(() => this.$router.push('/login'), 1000);
      } catch (err) {
        this.ok      = false;
        this.message =
          err.response?.data ?? '❌ Kunne ikke oprette bruger (server-fejl).';
      }
    }
  }
};
</script>

<style scoped>
/* alle dine oprindelige styles + grønt/rødt hint */
.signup-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #e6fffa;
  flex-direction: column;
}
.logo {
  font-size: 2rem;
  color: #2c7a7b;
  margin-bottom: 1rem;
}
form {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}
input,
select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.signup-button {
  width: 100%;
  padding: 0.7rem;
  background-color: #319795;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}
.signup-button:hover { background-color:#2c7a7b; }
.info-ok  { margin-top:1rem; color:#38a169; font-weight:bold; }
.info-err { margin-top:1rem; color:#c53030; font-weight:bold; }
.login-text { margin-top:1rem; font-size:0.95rem; }
.login-text a { color:#2c7a7b; font-weight:bold; text-decoration:none; }
.login-text a:hover { text-decoration:underline; }
</style>
