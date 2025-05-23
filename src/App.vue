<template>
  <div id="app">
    <div class="leaves-background"></div>
    
    <!-- Plant Mascot -->
    <div class="mascot-container">
      <div class="mascot">
        <div class="mascot-sun">
          <div class="mascot-face">
            <div class="mascot-eyes">
              <div class="mascot-eye"></div>
              <div class="mascot-eye"></div>
            </div>
            <div class="mascot-smile"></div>
          </div>
        </div>
        <div class="mascot-pot">
          <div class="mascot-plant">
            <div class="mascot-leaf left"></div>
            <div class="mascot-leaf right"></div>
            <div class="mascot-stem"></div>
          </div>
        </div>
      </div>
      <div class="mascot-speech" v-if="mascotSpeech">
        {{ mascotSpeech }}
      </div>
    </div>
    
    <nav v-if="isLoggedIn" class="navbar">
      <div class="nav-left">
        <button class="mobile-menu-toggle" @click="toggleMobileMenu">
          <span class="menu-icon"></span>
        </button>
        <div class="nav-links" :class="{ 'mobile-open': mobileMenuOpen }">
          <router-link to="/dashboard">
            <i class="nav-icon">🏠</i> Dashboard
          </router-link>
          <router-link to="/plant-list">
            <i class="nav-icon">🌱</i> Plant List
          </router-link>
          <router-link to="/notifications">
            <i class="nav-icon">🔔</i> Notifications
          </router-link>
          <router-link to="/history">
            <i class="nav-icon">📋</i> History
          </router-link>
          <router-link to="/add-remove">
            <i class="nav-icon">➕</i> Add/Remove Plants
          </router-link>
        </div>
      </div>
      <div class="nav-right">
        <NotificationBell class="notification-bell-container" />
        <button @click="logout" class="logout-button">Logout</button>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script>
import NotificationBell from '@/components/NotificationBell.vue';

export default {
  name: 'App',
  components: {
    NotificationBell
  },
  data() {
    return {
      isLoggedIn: !!sessionStorage.getItem('token'),
      mascotSpeech: '',
      mobileMenuOpen: false
    };
  },
  watch: {
    // Tjekker login-status igen, når ruten skifter
    $route() {
      this.isLoggedIn = !!sessionStorage.getItem('token');
      this.updateMascotSpeech();
      // Close mobile menu when route changes
      this.mobileMenuOpen = false;
    }
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    },
    logout() {
      sessionStorage.clear();
      this.isLoggedIn = false;
      this.$router.push('/login');
    },
    updateMascotSpeech() {
      // Her har vi lidt forskellige beskeder klar til maskotten, afhængigt af siden
      const messages = {
        '/dashboard': ['Welcome back to your dashboard!', 'How are your plants doing today?', 'Time to check on your green friends!'],
        '/plant-list': ['Here are all your lovely plants!', 'Your plant collection looks great!', 'Which plant needs attention today?'],
        '/notifications': ['Stay up to date with your plants!', 'Any important plant updates?', 'Your plants might need something!'],
        '/history': ['Let\'s see what\'s been happening!', 'Your plants have a story to tell!', 'Check out your plant history!'],
        '/add-remove': ['Add some new green friends!', 'Time to expand your plant family?', 'Managing your plant collection!'],
        '/login': ['Welcome back to Plant Homie!', 'Ready to care for your plants?', 'Your plants missed you!'],
        '/signup': ['Join our plant community!', 'Start your plant journey today!', 'Ready to become a plant parent?']
      };
      
      const path = this.$route.path;
      const routeMessages = messages[path] || ['Hello plant friend!', 'Welcome to Plant Homie!', 'Plants make life better!'];
      
      // Vælger en tilfældig besked fra puljen til den aktuelle side
      const randomIndex = Math.floor(Math.random() * routeMessages.length);
      this.mascotSpeech = routeMessages[randomIndex];
    }
  },
  mounted() {
    this.updateMascotSpeech();
    
    // Opdaterer maskottens besked med jævne mellemrum (hvert 20. sekund)
    setInterval(() => {
      this.updateMascotSpeech();
    }, 20000);
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5fcf7;
  color: #2c3e50;
  min-height: 100vh;
}

#app {
  position: relative;
  min-height: 100vh;
}

.leaves-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g fill="%2338a16922"><path d="M30,30 Q45,0 60,30 T90,60 T60,90 T30,60 T0,30 T30,30" /></g></svg>');
  background-size: 300px 300px;
  opacity: 0.1;
  z-index: -1;
}

/* Mascot Styles */
.mascot-container {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}

.mascot {
  width: 80px;
  height: 120px;
  position: relative;
  z-index: 1001;
  transform-origin: bottom center;
  animation: mascot-bounce 3s ease-in-out infinite;
  pointer-events: none;
}

.mascot-sun {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  background-color: #FFD700;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.mascot-face {
  position: relative;
  width: 100%;
  height: 100%;
}

.mascot-eyes {
  position: absolute;
  top: 15px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-evenly;
}

.mascot-eye {
  width: 8px;
  height: 8px;
  background-color: #333;
  border-radius: 50%;
  animation: mascot-blink 4s ease-in-out infinite;
}

.mascot-smile {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 25px;
  height: 12px;
  border-bottom: 3px solid #333;
  border-radius: 0 0 100px 100px;
}

.mascot-pot {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 35px;
  background-color: #8B4513;
  border-radius: 0 0 10px 10px;
}

.mascot-pot::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 0;
  width: 100%;
  height: 5px;
  background-color: #A0522D;
  border-radius: 10px 10px 0 0;
}

.mascot-plant {
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 40px;
}

.mascot-stem {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 25px;
  background-color: #2E8B57;
}

.mascot-leaf {
  position: absolute;
  width: 15px;
  height: 20px;
  background-color: #3CB371;
  border-radius: 50% 50% 50% 0;
  animation: mascot-leaf-wave 3s ease-in-out infinite;
}

.mascot-leaf.left {
  left: 5px;
  bottom: 15px;
  transform: rotate(-30deg);
  animation-delay: 0.5s;
}

.mascot-leaf.right {
  right: 5px;
  bottom: 15px;
  transform: rotate(30deg) scaleX(-1);
  animation-delay: 0s;
}

.mascot-speech {
  position: relative;
  margin-bottom: 10px;
  padding: 10px 15px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  font-size: 0.9rem;
  color: #4b5563;
  animation: fade-in 0.5s ease-out;
  pointer-events: none;
}

.mascot-speech::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 15px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid white;
}

@keyframes mascot-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes mascot-blink {
  0%, 45%, 55%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.1); }
}

@keyframes mascot-leaf-wave {
  0%, 100% { transform: rotate(-30deg); }
  50% { transform: rotate(-40deg); }
}

@keyframes mascot-leaf-wave-right {
  0%, 100% { transform: rotate(30deg) scaleX(-1); }
  50% { transform: rotate(40deg) scaleX(-1); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background: linear-gradient(to right, #4ade80, #22c55e);
  border-bottom: 1px solid #86efac;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  position: relative;
  align-items: center;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  text-decoration: none;
  color: white;
  font-weight: 500;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.nav-icon {
  margin-right: 6px;
  font-style: normal;
}

.nav-links a:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-links a.router-link-exact-active {
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.notification-bell-container {
  margin-right: 5px;
}

.logout-button {
  background-color: #ffffff;
  color: #16a34a;
  border: none;
  padding: 8px 15px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.logout-button:hover {
  background-color: #f0fdf4;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  position: relative;
  cursor: pointer;
  margin-right: 10px;
  z-index: 101;
}

.menu-icon, 
.menu-icon::before, 
.menu-icon::after {
  content: '';
  display: block;
  position: absolute;
  height: 3px;
  width: 100%;
  background-color: white;
  transition: all 0.3s ease;
}

.menu-icon {
  top: 13px;
}

.menu-icon::before {
  top: -8px;
}

.menu-icon::after {
  bottom: -8px;
}

.mobile-menu-toggle.active .menu-icon {
  background-color: transparent;
}

.mobile-menu-toggle.active .menu-icon::before {
  transform: rotate(45deg);
  top: 0;
}

.mobile-menu-toggle.active .menu-icon::after {
  transform: rotate(-45deg);
  bottom: 0;
}

h1, h2, h3 {
  color: #166534;
}

button {
  cursor: pointer;
}

/* Responsive styles */
@media (max-width: 768px) {
  .mascot-container {
    right: 10px;
    bottom: 10px;
  }
  
  .mascot {
    width: 60px;
    height: 90px;
  }
  
  .mascot-speech {
    max-width: 150px;
    font-size: 0.8rem;
  }
  
  .mascot-sun {
    width: 40px;
    height: 40px;
  }
  
  .mascot-eyes {
    top: 10px;
  }
  
  .mascot-eye {
    width: 6px;
    height: 6px;
  }
  
  .mascot-smile {
    width: 20px;
    height: 10px;
    bottom: 10px;
    border-bottom-width: 2px;
  }
  
  .mascot-pot {
    width: 30px;
    height: 25px;
  }
  
  .mascot-pot::before {
    height: 4px;
    top: -4px;
  }
  
  .mascot-plant {
    width: 25px;
    height: 30px;
    bottom: 18px;
  }
  
  .mascot-stem {
    height: 18px;
    width: 2px;
  }
  
  .mascot-leaf {
    width: 12px;
    height: 15px;
  }
  
  /* Mobile navigation styles */
  .navbar {
    padding: 0.6rem 1rem;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
  }
  
  .mobile-menu-toggle {
    display: block;
    padding: 8px;
    margin: -8px 5px -8px -8px;
  }
  
  .mobile-menu-toggle.active + .nav-links {
    left: 0;
  }
  
  .nav-links {
    position: fixed;
    top: 0;
    left: -100%;
    height: 100vh;
    width: 75%;
    max-width: 300px;
    flex-direction: column;
    gap: 0;
    background-color: #22c55e;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    transition: left 0.3s ease;
    padding-top: 60px;
    z-index: 100;
  }
  
  .nav-links.mobile-open {
    left: 0;
  }
  
  .nav-links a {
    padding: 1rem;
    border-radius: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .logout-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0.5rem;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 1000;
  }
  
  .logout-button {
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem;
  }
  
  .mascot-container {
    right: 5px;
    bottom: 5px;
  }
  
  .mascot {
    width: 45px;
    height: 65px;
  }
  
  .mascot-speech {
    max-width: 130px;
    font-size: 0.75rem;
    padding: 8px 12px;
  }
  
  .mascot-sun {
    width: 30px;
    height: 30px;
  }
  
  .mascot-eyes {
    top: 8px;
  }
  
  .mascot-eye {
    width: 4px;
    height: 4px;
  }
  
  .mascot-smile {
    width: 16px;
    height: 8px;
    bottom: 8px;
    border-bottom-width: 2px;
  }
  
  .mascot-pot {
    width: 22px;
    height: 20px;
  }
  
  .mascot-plant {
    width: 18px;
    height: 22px;
    bottom: 14px;
  }
  
  .mascot-stem {
    height: 14px;
    width: 2px;
  }
  
  .mascot-leaf {
    width: 9px;
    height: 12px;
  }
  
  .mascot-leaf.left {
    left: 3px;
    bottom: 10px;
  }
  
  .mascot-leaf.right {
    right: 3px;
    bottom: 10px;
  }
  
  .mobile-menu-toggle {
    padding: 10px;
    margin: -10px 0 -10px -10px;
  }
  
  .menu-icon, 
  .menu-icon::before, 
  .menu-icon::after {
    height: 2px;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  .menu-icon {
    top: 14px;
  }
  
  .menu-icon::before {
    top: -7px;
  }
  
  .menu-icon::after {
    bottom: -7px;
  }
}
</style>