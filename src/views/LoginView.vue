<template>
  <div class="login-page">
    <img src="@/assets/sun-logo.png" alt="Logo" class="logo-image" />
    <h1 class="logo">🌿 Plant Homie</h1>

    <!-- ----------- FORM ----------- -->
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Username:</label>
        <input v-model.trim="username" required />
      </div>

      <div class="form-group">
        <label>Password:</label>
        <input type="password" v-model="password" required />
      </div>

      <button class="login-button">Login</button>
    </form>

    <!-- ----------- BESKED ----------- -->
    <p v-if="message" :class="ok ? 'info-ok' : 'info-err'">{{ message }}</p>

    <p class="signup-text">
      Don't have an account?
      <router-link to="/signup">Sign up here</router-link>
    </p>
  </div>
</template>

<script>
import axios from 'axios';
import { useRouter } from 'vue-router';

/* Fælles base-URL (samme logik som i andre services) */
const API = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_URL ||
    process.env.VUE_APP_BACKEND_URL   ||
    'https://planthomieapi2025-b4aag0cnb6d2gsf6.westeurope-01.azurewebsites.net/api'
});

export default {
  name: 'LoginView',
  setup() {
    const router   = useRouter();

    // --- reaktiv tilstand ---
    const username = Vue.ref('');
    const password = Vue.ref('');
    const message  = Vue.ref('');
    const ok       = Vue.ref(false);

    /* ------------------------------
       LOGIN
    ------------------------------ */
    const handleLogin = async () => {
      message.value = '';
      try {
        const { data } = await API.post('/user/login', {
          userName: username.value,
          password: password.value
        });
        /* backend sender f.eks.
           { token: 'jwt-her', role: 'user' } */
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('role',  data.role ?? 'user');

        ok.value      = true;
        message.value = '✅ Logged in!';
        router.push('/dashboard');
      } catch (err) {
        ok.value      = false;
        message.value =
          err.response?.data ?? '❌ Invalid username or password';
      }
    };

    return { username, password, message, ok, handleLogin };
  }
};
</script>

<!-- STYLES -->
<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0fff4;
  flex-direction: column;
}

.logo {
  font-size: 2rem;
  color: #2f855a;
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

input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.login-button {
  width: 100%;
  padding: 0.7rem;
  background-color: #38a169;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}
.login-button:hover {
  background-color: #2f855a;
}

.info-ok  { margin-top:1rem; color:#38a169; }
.info-err { margin-top:1rem; color:#c53030; }

.signup-text {
  margin-top: 1rem;
}
</style>