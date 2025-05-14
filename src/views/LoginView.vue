<template>
  <div class="signup-page">
    <h1 class="logo">🌱 Create a New Account</h1>

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

      <!-- Subscription -->
      <div class="form-group">
        <label>Choose Subscription:</label>
        <select v-model="plan" required>
          <option value="Free">Free (10 plants …)</option>
          <option value="Premium_Silver">Premium Silver (30 …)</option>
          <option value="Premium_Gold">Premium Gold (50 …)</option>
          <option value="Premium_Plat">Premium Plat (100 …)</option>
        </select>
      </div>

      <button class="signup-button">Sign Up</button>
    </form>

    <p v-if="msg" :class="ok ? 'info-ok' : 'info-err'">{{ msg }}</p>

    <p class="login-text">
      Already have an account? <router-link to="/login">Log in here</router-link>
    </p>
  </div>
</template>

<script>
import axios       from 'axios';
import { ref }     from 'vue';
import { useRouter } from 'vue-router';

/* ---------- Samme logik som i andre services ---------- */
const API = axios.create({
  baseURL:
    process.env.VUE_APP_BACKEND_URL ||   // vue-cli / .env.[mode]
    'https://planthomieapi2025-b4aag0cnb6d2gsf6.westeurope-01.azurewebsites.net/api'
});

export default {
  name: 'SignupView',
  setup () {
    const router   = useRouter();
    const username = ref('');
    const password = ref('');
    const plan     = ref('Free');
    const msg      = ref('');
    const ok       = ref(false);

    /* ---------- HELPERS ---------- */
    const validUser = u =>
      u.length >= 16 && u.length <= 17 && !u.includes('@');

    const validPw   = p => {
      if (p.length < 10 || p.length > 20) return false;
      const hasUpper = /[A-Z]/.test(p);
      const hasLower = /[a-z]/.test(p);
      const hasDigit = /[0-9]/.test(p);
      const hasSpec  = /[^A-Za-z0-9]/.test(p);
      return hasUpper && hasLower && hasDigit && hasSpec;
    };

    /* ---------- SIGNUP ---------- */
    const handleSignup = async () => {
      msg.value = '';

      if (!validUser(username.value)) {
        msg.value = '❌ Brugernavn skal være 16-17 tegn og må ikke være en e-mail.';
        ok.value  = false;
        return;
      }
      if (!validPw(password.value)) {
        msg.value = '❌ Password skal være 10-20 tegn og indeholde store/små bogstaver, tal og specialtegn.';
        ok.value  = false;
        return;
      }

      try {
        await API.post('/user/signup', {
          userName    : username.value,
          password    : password.value,
          subscription: plan.value
        });

        ok.value  = true;
        msg.value = '✅ Konto oprettet! Du kan nu logge ind.';
        // valgfrit auto-redirect
        setTimeout(() => router.push('/login'), 1500);
      }
      catch (err) {
        ok.value  = false;
        msg.value = err.response?.data ?? '❌ Kunne ikke oprette konto.';
      }
    };

    return { username, password, plan, msg, ok, handleSignup };
  }
};
</script>

<style scoped>
/* … (samme styles som før, plus grøn/rød besked) … */
.info-ok  { margin-top:1rem; color:#38a169; font-weight:bold; }
.info-err { margin-top:1rem; color:#c53030; font-weight:bold; }
</style>
