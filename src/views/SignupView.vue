<template>
  <div class="signup-page">
    <h1 class="logo">🌱 Create a New Account</h1>

    <!-- ---------- FORM ---------- -->
    <form @submit.prevent="handleSignup">
      <!-- Username -->
      <div class="form-group">
        <label>Username:</label>
        <input v-model.trim="username" required />
      </div>

      <!-- Password -->
      <div class="form-group">
        <label>Password:</label>
        <input type="password" v-model="password" required />
      </div>

      <!-- Subscription plan -->
      <div class="form-group">
        <label>Choose Subscription:</label>
        <select v-model="selectedPlan" required>
          <option value="Free">Freeplan (10 plants, weekly pw-change)</option>
          <option value="Premium_Silver">Premium Silver (30 plants)</option>
          <option value="Premium_Gold">Premium Gold (50 plants)</option>
          <option value="Premium_Plat">Premium Plat (100 plants)</option>
        </select>
      </div>

      <button class="signup-button">Sign&nbsp;Up</button>
    </form>

    <!-- ---------- BESKED ---------- -->
    <p v-if="message" :class="ok ? 'info-ok' : 'info-err'">
      {{ message }}
    </p>

    <p class="login-text">
      Already have an account?
      <router-link to="/login">Log in here</router-link>
    </p>
  </div>
</template>

<script>
/* -------------------------------------------------------
   Enkel service-instans til kald
------------------------------------------------------- */
import axios from 'axios';
import { useRouter } from 'vue-router';

const API = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_URL ||       // Vite
    process.env.VUE_APP_BACKEND_URL ||        // Vue-CLI
    'https://planthomieapi2025-b4aag0cnb6d2gsf6.westeurope-01.azurewebsites.net/api'
});

export default {
  name: 'SignupView',
  setup() {
    const router       = useRouter();

    // --- reactive state ---
    const username     = Vue.ref('');
    const password     = Vue.ref('');
    const selectedPlan = Vue.ref('Free');
    const message      = Vue.ref('');
    const ok           = Vue.ref(false);

    /* ----------------------------
       FELT-VALIDERING
    ---------------------------- */
    const validate = () => {
      // Brugernavn 16-17 tegn, ingen @
      if (
        username.value.length < 16 ||
        username.value.length > 17 ||
        username.value.includes('@')
      ) {
        message.value =
          '❌ Brugernavn skal være 16-17 tegn og må ikke være en email.';
        ok.value = false;
        return false;
      }

      // Password 10-20 tegn
      if (password.value.length < 10 || password.value.length > 20) {
        message.value = '❌ Password skal være mellem 10 og 20 tegn.';
        ok.value = false;
        return false;
      }

      // Password regler
      const upper    = /[A-Z]/.test(password.value);
      const lower    = /[a-z]/.test(password.value);
      const digit    = /[0-9]/.test(password.value);
      const special  = /[^A-Za-z0-9]/.test(password.value);

      if (!(upper && lower && digit && special)) {
        message.value =
          '❌ Password skal indeholde store/små bogstaver, tal og specialtegn.';
        ok.value = false;
        return false;
      }

      return true;
    };

    /* ----------------------------
       SEND TIL BACKEND
    ---------------------------- */
    const handleSignup = async () => {
      if (!validate()) return;

      try {
        await API.post('/user/signup', {
          userName:     username.value,
          password:     password.value,
          subscription: selectedPlan.value
        });

        ok.value      = true;
        message.value = '✅ Konto oprettet! Du kan nu logge ind.';

        // lille delay for UX før redirect
        setTimeout(() => router.push('/login'), 1200);
      } catch (err) {
        ok.value      = false;
        // server-besked eller fallback
        message.value =
          err.response?.data ?? '❌ Kunne ikke oprette bruger (server-fejl).';
      }
    };

    return {
      username,
      password,
      selectedPlan,
      message,
      ok,
      handleSignup
    };
  }
};
</script>

<!-- STYLES -->
<style scoped>
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
.signup-button:hover {
  background-color: #2c7a7b;
}

.info-ok  { margin-top:1rem; color:#38a169; }
.info-err { margin-top:1rem; color:#c53030; }

.login-text {
  margin-top: 1rem;
  font-size: 0.95rem;
}
.login-text a {
  color: #2c7a7b;
  font-weight: bold;
  text-decoration: none;
}
.login-text a:hover {
  text-decoration: underline;
}
</style>
