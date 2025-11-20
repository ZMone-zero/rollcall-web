<template>
  <div class="page">
    <!-- 控制栏 -->
    <div class="card">
      <div class="controls">
        <div class="control-group">
          <div class="control-label">显示人数</div>
          <select class="select" v-model="limit" @change="loadRanking">
            <option value="5">5人</option>
            <option value="10">10人</option>
            <option value="15">15人</option>
            <option value="20">20人</option>
          </select>
        </div>
        
        <button class="btn-secondary" @click="toggleChart">
          {{ showChart ? '隐藏图表' : '显示图表' }}
        </button>
      </div>
    </div>

    <!-- 图表展示 -->
    <div class="card" v-if="showChart && ranking.length > 0">
      <div class="section-title">积分排名图表</div>
      <div class="chart-container">
        <div class="bar-chart">
          <div 
            class="chart-item" 
            v-for="(student, index) in ranking" 
            :key="student.student_id"
          >
            <div class="bar-wrapper">
              <div 
                class="bar score-bar" 
                :style="{ height: chartData.series[0].heights[index] + 'px' }"
              >
                <div class="bar-value">{{ student.total_score }}</div>
              </div>
              <div 
                class="bar count-bar" 
                :style="{ height: chartData.series[1].heights[index] + 'px' }"
              ></div>
            </div>
            <div class="bar-label">{{ student.name }}</div>
          </div>
        </div>
        
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color score-color"></div>
            <div class="legend-text">积分 (最高: {{ chartData.maxScore }})</div>
          </div>
          <div class="legend-item">
            <div class="legend-color count-color"></div>
            <div class="legend-text">点名次数 (最高: {{ chartData.maxCount }})</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 排名列表 -->
    <div class="card">
      <div class="list-header">
        <div class="section-title">积分排行榜</div>
        <div class="update-time">实时更新</div>
      </div>

      <div class="loading" v-if="loading">
        加载中...
      </div>

      <div class="empty-state" v-else-if="ranking.length === 0">
        <div class="empty-icon">🏆</div>
        <div class="empty-text">暂无排名数据</div>
      </div>

      <div class="ranking-list" v-else>
        <div 
          class="ranking-item" 
          v-for="(student, index) in ranking" 
          :key="student.student_id"
          :class="['top-' + (index + 1)]"
          @click="viewStudentDetail(student)"
        >
          <div class="rank">
            <div class="rank-number">{{ index + 1 }}</div>
            <div class="rank-medal" v-if="index < 3">
              {{ ['🥇', '🥈', '🥉'][index] }}
            </div>
          </div>

          <div class="student-avatar">
            {{ student.name.charAt(0) }}
          </div>

          <div class="student-info">
            <div class="student-main">
              <div class="student-name">{{ student.name }}</div>
              <div class="student-id">{{ student.student_id }}</div>
            </div>
            <div class="student-major" v-if="student.major">{{ student.major }}</div>
          </div>

          <div class="score-info">
            <div class="total-score">{{ student.total_score }}分</div>
            <div class="random-count">被点{{ student.random_count }}次</div>
          </div>

          <div class="ranking-arrow">›</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api.js';
import { util } from '../utils/util.js';

export default {
  name: 'Ranking',
  data() {
    return {
      ranking: [],
      loading: false,
      chartData: {
        categories: [],
        series: [
          { name: '积分', data: [], heights: [], color: '#3498db' },
          { name: '点名次数', data: [], heights: [], color: '#e74c3c' }
        ],
        maxScore: 0,
        maxCount: 0
      },
      showChart: true,
      limit: 10
    };
  },

  async mounted() {
    await this.loadRanking();
  },

  methods: {
    util,

    async loadRanking() {
      this.loading = true;

      try {
        const res = await api.getScoreRanking(this.limit);
        if (res.students) {
          this.ranking = res.students;
          this.prepareChartData(res.students);
        }
      } catch (error) {
        util.showError('加载排名失败');
        console.error('加载排名失败:', error);
      } finally {
        this.loading = false;
      }
    },

    prepareChartData(students) {
      const categories = students.map(student => student.name);
      const scores = students.map(student => student.total_score);
      const counts = students.map(student => student.random_count);

      const maxScore = Math.max(...scores, 1);
      const maxCount = Math.max(...counts, 1);

      const scoreHeights = scores.map(score => (score / maxScore) * 120);
      const countHeights = counts.map(count => (count / maxCount) * 60);

      this.chartData = {
        categories: categories,
        series: [
          {
            name: '积分',
            data: scores,
            heights: scoreHeights,
            color: '#3498db'
          },
          {
            name: '点名次数',
            data: counts,
            heights: countHeights,
            color: '#e74c3c'
          }
        ],
        maxScore: maxScore,
        maxCount: maxCount
      };
    },

    toggleChart() {
      this.showChart = !this.showChart;
    },

    viewStudentDetail(student) {
      util.showError('学生详情功能开发中');
    }
  }
};
</script>

<style scoped>
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 14px;
  color: #2c3e50;
}

.select {
  padding: 8px 12px;
  border: 2px solid #e1e1e1;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.chart-container {
  margin-top: 16px;
}

.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 160px;
  padding: 20px 0;
  border-bottom: 1px solid #ecf0f1;
}

.chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  margin-bottom: 8px;
}

.bar {
  border-radius: 4px 4px 0 0;
  position: relative;
  min-width: 20px;
}

.score-bar {
  background: #3498db;
  min-height: 20px;
}

.count-bar {
  background: #e74c3c;
  width: 12px;
  min-height: 10px;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #2c3e50;
  font-weight: 600;
  white-space: nowrap;
}

.bar-label {
  font-size: 12px;
  color: #7f8c8d;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.score-color {
  background: #3498db;
}

.count-color {
  background: #e74c3c;
}

.legend-text {
  font-size: 12px;
  color: #7f8c8d;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.update-time {
  font-size: 12px;
  color: #95a5a6;
}

.ranking-list {
  margin-top: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 12px;
  background: white;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.ranking-item:hover {
  background: #f8f9fa;
}

.ranking-item.top-1 {
  background: linear-gradient(135deg, #fff9c4, #fff59d);
  border-color: #f39c12;
}

.ranking-item.top-2 {
  background: linear-gradient(135deg, #f5f5f5, #eeeeee);
  border-color: #95a5a6;
}

.ranking-item.top-3 {
  background: linear-gradient(135deg, #ffccbc, #ffab91);
  border-color: #e74c3c;
}

.rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 40px;
}

.rank-number {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
}

.ranking-item.top-1 .rank-number {
  color: #f39c12;
}

.ranking-item.top-2 .rank-number {
  color: #7f8c8d;
}

.ranking-item.top-3 .rank-number {
  color: #e74c3c;
}

.rank-medal {
  font-size: 16px;
}

.student-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.student-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.ranking-item.top-1 .student-name {
  color: #f39c12;
}

.student-id {
  font-size: 12px;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 8px;
  border-radius: 8px;
}

.student-major {
  font-size: 12px;
  color: #95a5a6;
}

.score-info {
  text-align: right;
  min-width: 80px;
}

.total-score {
  font-size: 18px;
  font-weight: bold;
  color: #e74c3c;
  margin-bottom: 4px;
}

.random-count {
  font-size: 12px;
  color: #7f8c8d;
}

.ranking-arrow {
  font-size: 20px;
  color: #bdc3c7;
  font-weight: bold;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #7f8c8d;
}
</style>