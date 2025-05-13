<!-- <template> gammelt
  <div class="management-container">
    <h1 class="title">🌿 Manage Your Plants</h1>

    <div class="form-section">
      <input v-model="newPlantName" placeholder="New Plant Name" class="input" />
      <button @click="addPlant" class="add-button">🌱 Add Plant</button>
    </div>

    <ul class="plant-list">
      <li v-for="plant in customPlants" :key="plant.plant_ID" class="plant-item">
        {{ plant.plant_Name }} ({{ plant.plant_type }})
        <button @click="removePlant(plant.plant_ID)" class="remove-button">❌</button>
      </li>
    </ul>
  </div>
</template>

<script>
import { getAllPlants, createPlant, deletePlant } from '@/services/PlantService';

export default {
  name: 'AddRemoveView',
  data() {
    return {
      newPlantName: '',
      customPlants: [],
    };
  },
  methods: {
    async loadPlants() {
      try {
        const res = await getAllPlants();
        this.customPlants = res.data;
      } catch (err) {
        console.error('Kunne ikke hente planter:', err);
      }
    },
    async addPlant() {
      if (!this.newPlantName.trim()) return;
      try {
        // Find højeste eksisterende plant_ID
        const maxID = this.customPlants.length
          ? Math.max(...this.customPlants.map(p => p.plant_ID))
          : 0;

        const newPlant = {
          plant_ID: maxID + 1,
          plant_Name: this.newPlantName.trim(),
          plant_type: 'Custom',
        };

        await createPlant(newPlant);
        this.newPlantName = '';
        await this.loadPlants();
      } catch (err) {
        console.error('Kunne ikke tilføje plante:', err);
      }
    },
    async removePlant(id) {
      try {
        await deletePlant(id);
        await this.loadPlants();
      } catch (err) {
        console.error('Kunne ikke slette plante:', err);
      }
    },
  },
  mounted() {
    this.loadPlants();
  },
};
</script>

<style scoped>
.management-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #2f855a;
}

.form-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
}

.add-button {
  background: #38a169;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
}

.add-button:hover {
  background: #2f855a;
}

.plant-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plant-item {
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: #2d3748;
}

.remove-button {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.remove-button:hover {
  background: #c53030;
}
</style> -->
<template>
  <div class="management-container">
    <h1 class="title">🌿 Manage Your Plants</h1>

    <form @submit.prevent="addPlant" class="form-section" enctype="multipart/form-data">
      <input v-model="newPlantName" placeholder="New Plant Name" class="input" required />
      <input type="file" @change="handleFile" accept="image/*" class="input-file" />
      <button class="add-button">🌱 Add Plant</button>
    </form>

    <ul class="plant-list">
      <li v-for="p in plants" :key="p.plant_ID" class="plant-item">
        <div class="plant-info">
          <p><strong>{{ p.plant_Name }}</strong> ({{ p.plant_type }})</p>
          <img v-if="p.imageUrl" :src="backendNoApi + p.imageUrl" class="plant-image" />
        </div>
        <button @click="removePlant(p.plant_ID)" class="remove-button">❌</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAllPlants, createPlant, deletePlant } from '@/services/PlantService';

/* samme url‐kilde som i servicen */
const backend      = process.env.VUE_APP_BACKEND_URL || 'https://localhost:5001/api';
const backendNoApi = backend.replace(/\/api\/?$/, '');

const plants       = ref([]);
const newPlantName = ref('');
const file         = ref(null);

function handleFile(e) { file.value = e.target.files[0] ?? null; }

async function loadPlants() {
  try { plants.value = (await getAllPlants()).data; }
  catch (err) { console.error('Kunne ikke hente planter:', err); }
}

async function addPlant() {
  if (!newPlantName.value.trim()) return;
  try {
    await createPlant({ name: newPlantName.value.trim(), type: 'Custom', file: file.value });
    newPlantName.value = ''; file.value = null;
    await loadPlants();
  } catch (err) {
    console.error('Kunne ikke tilføje plante:', err);
  }
}

async function removePlant(id) {
  try { await deletePlant(id); await loadPlants(); }
  catch (err) { console.error('Kunne ikke slette plante:', err); }
}

onMounted(loadPlants);
</script>

<style scoped>
/* (de tidligere styles uændret) */
.management-container { max-width:700px; margin:0 auto; padding:2rem; text-align:center; }
.title                { font-size:1.8rem; margin-bottom:1.5rem; color:#2f855a; }
.form-section         { display:flex; gap:1rem; justify-content:center; margin-bottom:2rem; flex-wrap:wrap; }
.input,.input-file    { flex:1; padding:0.6rem; border:1px solid #cbd5e0; border-radius:6px; font-size:1rem; max-width:300px; }
.add-button           { background:#38a169; color:#fff; padding:0.6rem 1.2rem; border:none; border-radius:6px; cursor:pointer; font-weight:bold; }
.add-button:hover     { background:#2f855a; }
.plant-list           { list-style:none; padding:0; margin:0; }
.plant-item           { background:#f0fff4; border:1px solid #c6f6d5; padding:0.8rem 1rem; margin-bottom:0.5rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center; }
.plant-image          { max-width:100px; margin-top:0.5rem; border-radius:6px; }
.remove-button        { background:#e53e3e; color:#fff; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer; }
.remove-button:hover  { background:#c53030; }
</style>
