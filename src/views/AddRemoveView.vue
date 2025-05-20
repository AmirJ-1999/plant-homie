<template>
  <div class="plants-page">
    <h1 class="page-title">My Plants <span class="plants-count">{{ plants.length }}/{{ getMaxPlantsAllowed() }}</span></h1>

    <div class="controls">
      <div class="filter-dropdown">
        <label for="filter-select">Filter</label>
        <select id="filter-select" v-model="filterOption" @change="filterPlants">
          <option value="all">All Plants</option>
          <option value="indoor">Indoors</option>
          <option value="outdoor">Outdoors</option>
        </select>
      </div>
      <div class="sort-dropdown">
        <label for="sort-select">Sort</label>
        <select id="sort-select" v-model="sortOption" @change="sortPlants">
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="date-asc">Date (Oldest first)</option>
          <option value="date-desc">Date (Newest first)</option>
        </select>
      </div>
    </div>
    
    <div class="plants-grid">
      <!-- Plant Cards -->
      <div 
        v-for="plant in sortedPlants" 
        :key="plant.plant_ID" 
        :id="'plant-' + plant.plant_ID" 
        class="plant-card" 
        :class="{'removing': removingPlantId === plant.plant_ID}"
        @click="selectedPlant = plant"
      >
        <div class="delete-icon" @click.stop="removePlant(plant.plant_ID)" v-if="!removingPlantId">×</div>
        <div class="plant-name">{{ plant.plant_Name }}</div>
        <div class="plant-image-container">
          <img v-if="plant.imageUrl" :src="backendNoApi + plant.imageUrl" class="plant-image" />
          <div v-else class="plant-placeholder">
            <!-- Simple plant drawing if there is no image -->
            <svg viewBox="0 0 100 100" width="80" height="80">
              <rect x="40" y="70" width="20" height="20" fill="#8B4513" />
              <path d="M50 20 C30 40, 35 60, 50 70 C65 60, 70 40, 50 20" fill="#4CAF50" />
            </svg>
          </div>
        </div>
        <div class="card-overlay" v-if="removingPlantId === plant.plant_ID">
          <div class="removing-message">Removing...</div>
        </div>
      </div>
      
      <!-- Add New Plant Card -->
      <div class="plant-card add-card" @click="openAddModal">
        <div class="add-icon">+</div>
      </div>
    </div>

    <!-- Sun character -->
    <div class="sun-character">
      <div class="sun-body">
        <div class="sun-face">
          <div class="sun-eyes"></div>
          <div class="sun-smile"></div>
        </div>
      </div>
    </div>

    <!-- Add Plant Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <h2>Add New Plant</h2>
        <form @submit.prevent="addPlant">
          <div class="form-group">
            <label for="plant-name">Plant Name</label>
            <input 
              id="plant-name" 
              v-model="newPlantName" 
              placeholder="Enter plant name" 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="plant-environment">Plant Environment</label>
            <select 
              id="plant-environment" 
              v-model="plantEnvironment"
              class="environment-select"
            >
              <option value="">Custom</option>
              <option value="Indoor">Indoor Plant</option>
              <option value="Outdoor">Outdoor Plant</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="plant-image">Plant Image</label>
            <input 
              id="plant-image" 
              type="file" 
              @change="handleFile" 
              accept="image/*" 
              class="file-input"
            />
            <div class="image-preview" v-if="previewUrl">
              <img :src="previewUrl" alt="Preview" />
            </div>
          </div>
          
          <div class="modal-buttons">
            <button type="button" class="cancel-button" @click="closeAddModal">Cancel</button>
            <button type="submit" class="submit-button">Add Plant</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Plant Details Modal -->
    <div v-if="selectedPlant" class="modal-overlay" @click="selectedPlant = null">
      <div class="modal-content plant-details-modal" @click.stop>
        <h2>Plant Details</h2>
        
        <div class="plant-detail-image">
          <img v-if="selectedPlant.imageUrl" :src="backendNoApi + selectedPlant.imageUrl" alt="Plant" />
          <div v-else class="plant-placeholder large">
            <svg viewBox="0 0 100 100" width="150" height="150">
              <rect x="40" y="70" width="20" height="20" fill="#8B4513" />
              <path d="M50 20 C30 40, 35 60, 50 70 C65 60, 70 40, 50 20" fill="#4CAF50" />
            </svg>
          </div>
        </div>
        
        <div class="plant-info">
          <div class="plant-info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">{{ selectedPlant.plant_Name }}</span>
          </div>
          
          <div class="plant-info-item">
            <span class="info-label">ID:</span>
            <span class="info-value">{{ selectedPlant.plant_ID }}</span>
          </div>
          
          <div class="plant-info-item" v-if="selectedPlant.plant_type">
            <span class="info-label">Type:</span>
            <span class="info-value">{{ selectedPlant.plant_type }}</span>
          </div>
        </div>
        
        <div class="modal-buttons">
          <button type="button" class="delete-button" @click="removePlantFromModal(selectedPlant.plant_ID)">Delete Plant</button>
          <button type="button" class="cancel-button" @click="selectedPlant = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllPlants, createPlant, deletePlant } from '@/services/PlantService';

export default {
  name: 'AddRemoveView',
  data() {
    return {
      plants: [],
      sortedPlants: [],
      sortOption: 'name-asc',
      newPlantName: '',
      file: null,
      previewUrl: '',
      showAddModal: false,
      removingPlantId: null,
      isLoading: false,
      backend: 'https://planthomieapi20250519212023-g3dxbqerfvhhf0a6.northeurope-01.azurewebsites.net/api',  // Latest Azure backend
      selectedPlant: null,
      plantEnvironment: '',
      filterOption: 'all',
    };
  },
  computed: {
    backendNoApi() {
      return this.backend.replace(/\/api\/?$/, '');
    }
  },
  methods: {
    async loadPlants() {
      console.log('Loading plants from API');
      
      // Check if user is authenticated
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found in loadPlants');
        this.$router.push('/login');
        return;
      }
      
      try {
        console.log('Sending request to get all plants');
        const response = await getAllPlants();
        console.log('Plants loaded successfully:', response.status);
        console.log('Received plants:', response.data);
        
        // The data should now be an array thanks to our PlantService handling
        this.plants = Array.isArray(response.data) ? response.data : [];
        this.filterPlants(); // Apply filtering and sorting
      } catch (err) {
        console.error('Could not load plants:', err);
        
        if (err.response) {
          console.error('Error status:', err.response.status);
          console.error('Error data:', err.response.data);
          
          if (err.response.status === 401) {
            console.warn('Authentication error in loadPlants - redirecting to login');
            // Clear token and redirect to login
            sessionStorage.removeItem('token');
            this.$router.push('/login');
          }
        }
        
        this.plants = [];
        this.filterPlants(); // Apply filtering even with empty array
      }
    },
    getMaxPlantsAllowed() {
      const subscription = sessionStorage.getItem('subscription') || 'Free';
      switch (subscription) {
        case 'Premium_Silver': return 30;
        case 'Premium_Gold': return 50;
        case 'Premium_Plat': return 100;
        default: return 10; // Standard for gratis abonnement
      }
    },
    filterPlants() {
      // First filter by environment
      let filteredPlants = [...this.plants];
      
      if (this.filterOption === 'indoor') {
        filteredPlants = filteredPlants.filter(plant => {
          // Check for plant_environment or extract from plant_Type or Plant_Type
          const environment = plant.plant_environment || '';
          const type = (plant.plant_Type || plant.plant_type || '').toLowerCase();
          return environment === 'Indoor' || type.includes('indoor');
        });
      } else if (this.filterOption === 'outdoor') {
        filteredPlants = filteredPlants.filter(plant => {
          const environment = plant.plant_environment || '';
          const type = (plant.plant_Type || plant.plant_type || '').toLowerCase();
          return environment === 'Outdoor' || type.includes('outdoor');
        });
      }
      
      // Then sort the filtered plants
      this.sortFilteredPlants(filteredPlants);
    },
    sortFilteredPlants(filteredPlants) {
      switch (this.sortOption) {
        case 'name-asc':
          filteredPlants.sort((a, b) => a.plant_Name.localeCompare(b.plant_Name));
          break;
        case 'name-desc':
          filteredPlants.sort((a, b) => b.plant_Name.localeCompare(a.plant_Name));
          break;
        case 'date-asc':
          filteredPlants.sort((a, b) => a.plant_ID - b.plant_ID);
          break;
        case 'date-desc':
          filteredPlants.sort((a, b) => b.plant_ID - a.plant_ID);
          break;
      }
      this.sortedPlants = filteredPlants;
    },
    sortPlants() {
      this.filterPlants(); // Apply filtering and sorting in one step
    },
    openAddModal() {
      if (this.plants.length >= this.getMaxPlantsAllowed()) {
        alert(`You've reached your plan limit of ${this.getMaxPlantsAllowed()} plants. Please upgrade your subscription to add more plants.`);
        return;
      }
      this.showAddModal = true;
    },
    closeAddModal() {
      this.showAddModal = false;
      this.newPlantName = '';
      this.file = null;
      this.previewUrl = '';
      this.plantEnvironment = '';
    },
    handleFile(e) {
      this.file = e.target.files[0] || null;
      if (this.file) {
        // Laver en lille forhåndsvisning af billedet
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.previewUrl = evt.target.result;
        };
        reader.readAsDataURL(this.file);
      } else {
        this.previewUrl = '';
      }
    },
    async addPlant() {
      console.log('Starting plant addition process');
      
      // Tjekker lige, at plantenavnet er ok (ikke tomt og uden ekstra mellemrum)
      const trimmedName = this.newPlantName.trim();
      if (!trimmedName) {
        console.warn('Empty plant name provided');
        alert('Plant name cannot be empty.');
        return;
      }
      
      // Har brugeren mon plads til flere planter ifølge abonnementet?
      if (this.plants.length >= this.getMaxPlantsAllowed()) {
        console.warn(`Plan limit reached: ${this.plants.length}/${this.getMaxPlantsAllowed()}`);
        alert(`You've reached your plan limit of ${this.getMaxPlantsAllowed()} plants. Please upgrade your subscription to add more plants.`);
        return;
      }
      
      // Image is optional, so we don't need to check for it anymore
      
      // Check if user is properly authenticated
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        alert('You need to be logged in to add plants. Please log in again.');
        this.$router.push('/login');
        return;
      }
      
      console.log('Validated input, proceeding with plant creation');
      
      try {
        // Determine plant type based on environment or custom type
        const plantType = this.plantEnvironment ? `${this.plantEnvironment} Plant` : 'Custom';
        
        const response = await createPlant({
          name: trimmedName,
          type: plantType,
          file: this.file
        });
        
        console.log('Plant creation successful:', response.data);
        this.closeAddModal();
        // Set filter to 'all' to ensure the user can see their newly added plant
        this.filterOption = 'all';
        await this.loadPlants();
      } catch (err) {
        console.error('Could not add plant:', err);
        
        let errorMessage = 'Failed to add plant. Please try again.';
        
        if (err.response) {
          console.error('Error status:', err.response.status);
          console.error('Error data:', err.response.data);
          
          if (err.response.status === 401) {
            errorMessage = 'Your login session has expired. Please log in again.';
            // Clear token and redirect to login
            sessionStorage.removeItem('token');
            this.$router.push('/login');
          } else if (err.response.status === 500) {
            errorMessage = 'Server error occurred. This could be due to a duplicate plant name or invalid image format.';
          }
        } else if (err.request) {
          console.error('No response received:', err.request);
          errorMessage = 'Server did not respond. Please check your connection and try again.';
        }
        
        alert(errorMessage);
      }
    },
    async removePlant(id) {
      // Springer over, hvis vi allerede er i gang med at fjerne en plante
      if (this.removingPlantId !== null) return;
      
      this.removingPlantId = id;
      
      if (confirm('Are you sure you want to delete this plant?')) {
        try {
          this.isLoading = true;
          
          // Finder lige navnet på planten, så beskeden til brugeren bliver bedre
          const plantToRemove = this.plants.find(p => p.plant_ID === id);
          const plantName = plantToRemove ? plantToRemove.plant_Name : 'plant';
          
          // Kalder API'et for at få planten slettet fra systemet
        await deletePlant(id);
          
          // Fjerner planten fra listen her lokalt, så UI'en reagerer prompte
          this.plants = this.plants.filter(plant => plant.plant_ID !== id);
          this.sortPlants();
          
          // Fortæller brugeren, at det gik godt
          setTimeout(() => {
            alert(`${plantName} has been successfully deleted.`);
          }, 500);
          
      } catch (err) {
          console.error('Could not delete plant:', err);
          alert('Failed to delete plant. Please try again.');
        } finally {
          setTimeout(() => {
            this.isLoading = false;
            this.removingPlantId = null;
          }, 500);
        }
      } else {
        // Okay, brugeren fortrød sletningen
        this.removingPlantId = null;
      }
    },
    removePlantFromModal(id) {
      this.removePlant(id);
      this.selectedPlant = null;
    }
  },
  mounted() {
    this.loadPlants();
  }
};
</script>

<style scoped>
.plants-page {
  padding: 2rem;
  min-height: 100vh;
  background-color: #1CA1E2; /* Blå baggrund svarende til billedet */
  color: white;
  position: relative;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.plants-count {
  font-size: 1.2rem;
  font-weight: normal;
}

.controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-dropdown {
  background-color: white;
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-dropdown select {
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.sort-dropdown {
  background-color: white;
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sort-dropdown select {
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.plants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.plant-card {
  background-color: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  color: #333;
  border: 3px solid black;
  position: relative;
  overflow: hidden;
  height: 220px;
  transition: all 0.3s ease, transform 0.5s ease, opacity 0.5s ease;
  cursor: pointer;
}

.plant-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-5px);
  border-color: #1CA1E2;
}

.plant-card.removing {
  transform: scale(0.9);
  opacity: 0.5;
  border-color: #ff4d4d;
  pointer-events: none;
}

.plant-name {
  text-align: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: #f0f0f0;
  border-radius: 6px;
  border: 2px solid black;
  position: relative;
  z-index: 4;
}

.plant-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.plant-image {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
}

.plant-placeholder {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.plant-card .delete-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 25px;
  height: 25px;
  background-color: #ff4d4d;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.3s, transform 0.3s;
  z-index: 5;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.plant-card:hover .delete-icon {
  opacity: 1;
  transform: scale(1);
}

.delete-icon:hover {
  background-color: #ff3333;
  transform: scale(1.1);
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  animation: fadeIn 0.3s ease-in-out;
  z-index: 4;
}

.removing-message {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background-color: rgba(255, 77, 77, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  animation: pulse 1.5s infinite;
}

.add-card {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}

.add-card:hover {
  transform: scale(1.05);
}

.add-icon {
  font-size: 3rem;
  color: #666;
}

.sun-character {
  position: fixed;
  bottom: 30px;
  left: 30px;
  z-index: 10;
}

.sun-body {
  width: 80px;
  height: 80px;
  background-color: #FFD700;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

.sun-face {
  width: 60%;
  height: 60%;
  position: relative;
}

.sun-eyes {
  position: absolute;
  top: 30%;
  left: 0;
  width: 100%;
  height: 10px;
}

.sun-eyes::before, 
.sun-eyes::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #333;
  border-radius: 50%;
  top: 0;
}

.sun-eyes::before {
  left: 10px;
}

.sun-eyes::after {
  right: 10px;
}

.sun-smile {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 14px;
  border-bottom: 3px solid #333;
  border-radius: 0 0 20px 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  color: #333;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #1CA1E2;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.image-preview {
  margin-top: 1rem;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 8px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button {
  background-color: #f0f0f0;
  color: #333;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.submit-button {
  background-color: #1CA1E2;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.file-input {
  padding: 10px 0;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

@media (max-width: 768px) {
  .plants-page {
    padding: 1.5rem 1rem;
  }
  
  .page-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    display: block;
  }

  .controls {
    margin-bottom: 1.5rem;
    justify-content: center;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-dropdown,
  .sort-dropdown {
    width: 100%;
    max-width: 300px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.8rem;
  }
  
  .filter-dropdown select,
  .sort-dropdown select {
    flex: 1;
    margin-left: 0.5rem;
    padding: 0.5rem;
    font-size: 16px; /* Prevent iOS zoom on select */
  }
  
  .plants-grid {
    grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
    gap: 1rem;
    margin-bottom: 5rem; /* Extra space at bottom for sun character */
  }
  
  .plant-card {
    height: 160px;
    padding: 0.7rem;
    border-width: 2px;
  }
  
  .plant-name {
    font-size: 0.9rem;
    padding: 0.4rem;
    margin-bottom: 0.3rem;
    border-width: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .plant-image-container {
    margin-bottom: 0.5rem;
  }
  
  .plant-image {
    max-height: 90px;
  }
  
  .plant-placeholder {
    height: 90px;
  }
  
  .plant-card .delete-icon {
    /* Make delete button always visible on mobile */
    opacity: 1;
    width: 28px;
    height: 28px;
    font-size: 20px;
    top: 8px;
    right: 8px;
    transform: scale(1);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3);
  }
  
  /* Override hover styles for mobile */
  .plant-card:hover .delete-icon {
    opacity: 1;
    transform: scale(1);
  }
  
  .delete-icon:active {
    background-color: #ff3333;
    transform: scale(0.95);
  }
  
  .sun-character {
    bottom: 15px;
    left: 15px;
  }
  
  .sun-body {
    width: 50px;
    height: 50px;
  }

  /* Make modal more mobile-friendly */
  .modal-content {
    padding: 1.2rem;
    width: 95%;
    border-radius: 10px;
  }
  
  .modal-content h2 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    margin-bottom: 0.3rem;
  }
  
  .form-group input {
    padding: 0.6rem;
    font-size: 16px; /* Prevent iOS zoom on input */
  }
  
  .modal-buttons {
    margin-top: 1.5rem;
    gap: 0.7rem;
  }
  
  .cancel-button, .submit-button {
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
    min-width: 100px;
  }

  .plant-details-modal {
    padding: 1rem;
  }
  
  .plant-info-item {
    padding: 0.6rem;
    font-size: 0.9rem;
  }
  
  .info-label {
    width: 60px;
  }
}

  @media (max-width: 480px) {
    .plants-page {
      padding: 3.5rem 0.7rem 4rem 0.7rem;
    }
    
    .page-title {
      font-size: 2rem;
      margin-bottom: 1rem;
      margin-top: 0;
      padding-top: 0;
      display: block;
      font-weight: bold;
      color: white;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
      position: relative;
      z-index: 5;
    }
    
    .plants-count {
      font-size: 1rem;
      opacity: 0.9;
    }
    
    .controls {
      margin-bottom: 1.2rem;
      flex-direction: column;
      gap: 0.6rem;
      width: 100%;
      align-items: center;
    }
    
    .filter-dropdown,
    .sort-dropdown {
      width: 90%;
      max-width: 300px;
      padding: 0.4rem 0.8rem;
    }
  
  .plants-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }
  
  .plant-card {
    height: auto;
    min-height: 130px;
    max-height: 160px;
    border-width: 2px;
    padding: 0.6rem 0.5rem 0.4rem 0.5rem;
    margin-bottom: 0.5rem;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: visible;
  }
  
  .plant-name {
    position: absolute;
    top: -10px;
    left: 0;
    right: 0;
    width: 90%;
    margin: 0 auto;
    font-size: 0.9rem;
    padding: 0.25rem 0.5rem;
    margin-bottom: 0.4rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    text-align: center;
    z-index: 5;
  }
  
  .plant-image-container {
    margin-top: 15px;
    flex: 1;
    margin-bottom: 0;
    max-height: 85px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .plant-image {
    max-height: 80px;
  }
  
  .plant-placeholder {
    height: 80px;
  }
  
  .plant-card .delete-icon {
    width: 26px;
    height: 26px;
    font-size: 18px;
    top: 5px;
    right: 5px;
    background-color: rgba(255, 77, 77, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.3);
    z-index: 10;
    position: absolute;
  }
  
  .delete-icon:active {
    background-color: #ff3333;
  }
  
  .add-card {
    margin-top: 10px;
    height: auto;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .add-icon {
    font-size: 2.5rem;
    color: #444;
  }
  
  .modal-buttons {
    flex-direction: column-reverse;
  }
  
  .modal-buttons button {
    width: 100%;
  }
  
  .sun-character {
    bottom: 10px;
    left: 10px;
  }
  
  .sun-body {
    width: 40px;
    height: 40px;
  }
  
  .sun-eyes::before, .sun-eyes::after {
    width: 6px;
    height: 6px;
  }
  
  .sun-smile {
    width: 20px;
    border-bottom: 2px solid #333;
  }
}

.plant-details-modal {
  max-width: 500px;
}

.plant-detail-image {
  text-align: center;
  margin-bottom: 1.5rem;
}

.plant-detail-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

.plant-placeholder.large {
  width: 100%;
  height: 200px;
  background-color: #f9f9f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plant-info {
  margin-bottom: 1.5rem;
}

.plant-info-item {
  padding: 0.8rem;
  border-bottom: 1px solid #eee;
  display: flex;
}

.info-label {
  font-weight: bold;
  width: 80px;
  color: #666;
}

.info-value {
  flex: 1;
}

.delete-button {
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.delete-button:hover {
  background-color: #ff3333;
}

.environment-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  font-size: 1rem;
  color: #333;
}
</style>
