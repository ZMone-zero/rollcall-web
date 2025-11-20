<template>
  <div class="page">
    <!-- 点名模式选择 -->
    <div class="card">
      <div class="flex-between">
        <div class="section-title">点名模式</div>
        <div class="text-muted">当前学生: {{studentsCount}}人</div>
      </div>
      <div class="mode-selector">
        <button 
          v-for="mode in modes"
          :key="mode.id"
          :class="['mode-btn', { active: rollcallType === mode.id }]"
          @click="switchRollcallType(mode.id)"
        >
          {{ mode.name }}
        </button>
      </div>
    </div>

    <!-- 点名区域 -->
    <div class="card rollcall-area">
      <div class="rollcall-display">
        <div v-if="currentStudent" class="current-student">
          <div class="student-avatar">
            {{ currentStudent.name.charAt(0) }}
          </div>
          <div class="student-info">
            <div class="student-name">{{ currentStudent.name }}</div>
            <div class="student-id">{{ currentStudent.student_id }}</div>
            <div v-if="currentStudent.major" class="student-major">{{ currentStudent.major }}</div>
            <div class="student-stats">
              <span class="stat">积分: {{ currentStudent.total_score }}</span>
              <span class="stat">被点: {{ currentStudent.random_count }}次</span>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-display">
          <div class="empty-icon">📝</div>
          <div class="empty-text">点击下方按钮开始点名</div>
        </div>
      </div>

      <button 
        class="rollcall-btn"
        @click="handleRollcall"
        :disabled="isRollcalling"
      >
        {{ isRollcalling ? '点名中...' : rollcallText }}
      </button>
    </div>

    <!-- 快速操作 -->
    <div v-if="currentStudent" class="card">
      <div class="section-title">快速操作</div>
      <div class="quick-actions">
        <button 
          v-for="action in quickActions"
          :key="action.label"
          :class="['quick-btn', action.class]"
          @click="quickAddScore(action.points, action.reason)"
        >
          {{ action.label }}
        </button>
        <button class="quick-btn btn-custom" @click="openScoreModal">
          自定义
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api.js';

export default {
  name: 'RollCall',
  data() {
    return {
      currentStudent: null,
      rollcallType: 'random',
      orderIndex: 0,
      isRollcalling: false,
      studentsCount: 0,
      
      modes: [
        { id: 'random', name: '🎲 随机点名' },
        { id: 'order', name: '🔢 顺序点名' }
      ],
      
      quickActions: [
        { points: 1, reason: '按时到课', label: '+1 到课', class: 'btn-success' },
        { points: 0.5, reason: '重复问题', label: '+0.5 重复', class: 'btn-warning' },
        { points: 2, reason: '回答问题', label: '+2 回答', class: 'btn-info' },
        { points: -1, reason: '未重复问题', label: '-1 未重复', class: 'btn-danger' }
      ]
    };
  },
  
  computed: {
    rollcallText() {
      return this.rollcallType === 'random' ? '🎲 随机点名' : '🔢 顺序点名';
    }
  },
  
  async mounted() {
    await this.loadStudentsCount();
  },
  
  methods: {
    async loadStudentsCount() {
      try {
        const res = await api.getDebugCount();
        if (res.success) {
          this.studentsCount = res.student_count;
        }
      } catch (error) {
        this.showError('获取学生数量失败');
      }
    },
    
    switchRollcallType(type) {
      this.rollcallType = type;
      this.currentStudent = null;
    },
    
    async handleRollcall() {
      if (this.isRollcalling) return;
      
      this.isRollcalling = true;
      this.showLoading('点名中...');
      
      try {
        let res;
        if (this.rollcallType === 'random') {
          res = await api.randomRollcall();
        } else {
          res = await api.orderRollcall(this.orderIndex);
          this.orderIndex = res.next_index;
        }
        
        if (res.success) {
          this.currentStudent = res.student;
          this.showSuccess(`点到: ${res.student.name}`);
          await this.loadStudentsCount();
        }
      } catch (error) {
        this.showError(error.errMsg || '点名失败');
      } finally {
        this.isRollcalling = false;
        this.hideLoading();
      }
    },
    
    async quickAddScore(points, reason) {
      if (!this.currentStudent) {
        this.showError('请先选择学生');
        return;
      }

      const currentStudentBackup = { ...this.currentStudent };
      
      this.showLoading('更新积分中...');
      
      try {
        const res = await api.updateScore(
          this.currentStudent.student_id,
          points,
          reason
        );

        if (res.success) {
          this.showSuccess(`积分${points > 0 ? '增加' : '减少'}成功`);
          
          // 重新加载当前学生的数据
          try {
            const updatedStudent = await api.getStudentById(currentStudentBackup.student_id);
            if (updatedStudent) {
              this.currentStudent = updatedStudent;
            } else {
              this.currentStudent.total_score += points;
            }
          } catch (updateError) {
            this.currentStudent.total_score += points;
          }
        }
      } catch (error) {
        this.showError('积分更新失败');
        if (!this.currentStudent && currentStudentBackup) {
          this.currentStudent = currentStudentBackup;
        }
      } finally {
        this.hideLoading();
      }
    },
    
    openScoreModal() {
      this.showError('自定义积分功能开发中');
    },

    // 工具方法
    showSuccess(message) {
      alert('✅ ' + message);
    },

    showError(message) {
      alert('❌ ' + message);
    },

    showLoading(message = '加载中...') {
      console.log('Loading: ', message);
    },

    hideLoading() {
      // 简单实现
    }
  }
};
</script>

<style scoped>
.page {
  padding: 0;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e1e1e1;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.text-muted {
  color: #7f8c8d;
  font-size: 14px;
}

.mode-selector {
  display: flex;
  gap: 12px;
}

.mode-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  background: white;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.mode-btn.active {
  border-color: #3498db;
  background: #3498db;
  color: white;
}

.rollcall-area {
  text-align: center;
}

.rollcall-display {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.current-student {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.student-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.student-info {
  text-align: center;
}

.student-name {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
}

.student-id {
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.student-major {
  font-size: 14px;
  color: #95a5a6;
  margin-bottom: 12px;
}

.student-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.stat {
  font-size: 14px;
  color: #3498db;
  background: #ecf0f1;
  padding: 4px 12px;
  border-radius: 12px;
}

.empty-display {
  color: #bdc3c7;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
}

.rollcall-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  background: #3498db;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.rollcall-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.rollcall-btn:hover:not(:disabled) {
  background: #2980b9;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quick-btn {
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.quick-btn:hover {
  opacity: 0.9;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-info {
  background: #3498db;
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-custom {
  background: #9b59b6;
  color: white;
}
</style>