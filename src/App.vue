<template>
  <div class="app">
    <header class="header">
      <h1>🎯 课堂点名系统</h1>
      <nav class="nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['nav-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </nav>
    </header>

    <main class="main">
      <RollCall v-if="activeTab === 'rollcall'" />
      <StudentList v-if="activeTab === 'students'" />
      <Ranking v-if="activeTab === 'ranking'" />
    </main>
  </div>
</template>

<script>
import RollCall from './components/RollCall.vue'
import StudentList from './components/StudentList.vue'
import Ranking from './components/Ranking.vue'

export default {
  name: 'App',
  components: {
    RollCall,
    StudentList,
    Ranking
  },
  data() {
    return {
      activeTab: 'rollcall',
      tabs: [
        { id: 'rollcall', name: '🎲 点名' },
        { id: 'students', name: '👥 学生' },
        { id: 'ranking', name: '🏆 排名' }
      ]
    }
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: white;
}

.header {
  background: #2c3e50;
  color: white;
  padding: 20px;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header h1 {
  font-size: 24px;
  margin-bottom: 15px;
}

.nav {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background: rgba(255,255,255,0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.nav-btn.active {
  background: #3498db;
}

.nav-btn:hover {
  background: rgba(255,255,255,0.3);
}

.main {
  padding: 20px;
  min-height: calc(100vh - 120px);
}
</style>