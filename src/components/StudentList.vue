<template>
  <div class="page">
    <!-- 操作栏 -->
    <div class="card">
      <div class="action-buttons">
        <button class="btn-primary" @click="openImportModal">
          📊 Excel导入
        </button>
        <button class="btn-success" @click="exportScoreDetail">
          📥 导出积分
        </button>
      </div>
    </div>

    <!-- 导入结果 -->
    <div class="card" v-if="importResult && importResult.success">
      <div class="import-result success">
        <div class="result-icon">✅</div>
        <div class="result-info">
          <div class="result-title">导入成功</div>
          <div class="result-desc">
            总计: {{importResult.total}} 人, 
            成功: {{importResult.imported}} 人
            <span v-if="importResult.total > importResult.imported">
              ({{importResult.total - importResult.imported}} 人已存在)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 学生列表 -->
    <div class="card">
      <div class="list-header">
        <div class="section-title">学生列表</div>
        <div class="student-count">共 {{students.length}} 人</div>
      </div>

      <div class="loading" v-if="loading">
        加载中...
      </div>

      <div class="empty-state" v-else-if="students.length === 0">
        <div class="empty-icon">👥</div>
        <div class="empty-text">暂无学生数据</div>
      </div>

      <div class="student-list" v-else>
        <div 
          class="student-item" 
          v-for="student in students" 
          :key="student.student_id"
        >
          <div class="student-avatar">
            {{ student.name.charAt(0) }}
          </div>
          
          <div class="student-info">
            <div class="student-main">
              <div class="student-name">{{ student.name }}</div>
              <div class="student-id">{{ student.student_id }}</div>
            </div>
            <div class="student-major" v-if="student.major">{{ student.major }}</div>
            
            <div class="student-stats">
              <span class="stat score">积分: {{ student.total_score }}</span>
              <span class="stat count">被点: {{ student.random_count }}次</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <div class="modal" v-if="showImportModal">
      <div class="modal-mask" @click="closeImportModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">Excel导入学生</div>
          <div class="modal-close" @click="closeImportModal">×</div>
        </div>
        
        <div class="modal-body">
          <div class="import-guide">
            <div class="guide-title">导入说明</div>
            <div class="guide-desc">
              1. 准备Excel文件，包含以下列：<br>
              2. 第一列：学号（必填）<br>
              3. 第二列：姓名（必填）<br>
              4. 第三列：专业（可选）<br>
              5. 第一行为表头，从第二行开始为数据
            </div>
          </div>

          <input 
            type="file" 
            ref="fileInput"
            accept=".xlsx,.xls" 
            @change="handleFileSelect"
            style="display: none"
          >
          <button class="btn-primary import-btn" @click="triggerFileInput">
            📁 选择Excel文件
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api.js';

export default {
  name: 'StudentList',
  data() {
    return {
      students: [],
      loading: false,
      showImportModal: false,
      importResult: null
    };
  },

  async mounted() {
    await this.loadStudents();
  },

  methods: {
    async loadStudents() {
      this.loading = true;
      
      try {
        const res = await api.getAllStudents();
        if (res.students) {
          this.students = res.students;
        }
      } catch (error) {
        this.showError('加载学生列表失败');
        console.error('加载学生失败:', error);
      } finally {
        this.loading = false;
      }
    },

    openImportModal() {
      this.showImportModal = true;
      this.importResult = null;
    },

    closeImportModal() {
      this.showImportModal = false;
      this.importResult = null;
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    async handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        this.showError('请上传Excel文件');
        return;
      }

      this.showLoading('导入中...');

      try {
        const res = await api.importStudents(file);
        this.importResult = res;

        if (res.success) {
          this.showSuccess(`成功导入 ${res.imported} 名学生`);
          this.closeImportModal();
          await this.loadStudents();
        } else {
          this.showError(res.message || '导入失败');
        }
      } catch (error) {
        this.showError('文件上传失败');
        console.error('导入失败:', error);
      } finally {
        this.hideLoading();
        event.target.value = '';
      }
    },

    async exportScoreDetail() {
      this.showLoading('生成导出文件中...');
      
      try {
        const result = await api.exportScoreDetail();
        if (result.success) {
          this.showSuccess('导出成功！文件已开始下载');
        }
      } catch (error) {
        this.showError('导出失败：' + (error.message || '请稍后重试'));
      } finally {
        this.hideLoading();
      }
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
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-buttons button {
  font-size: 14px;
  padding: 12px;
}

.import-result {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
}

.import-result.success {
  background: #d5f4e6;
  border: 1px solid #27ae60;
}

.result-icon {
  font-size: 20px;
}

.result-info {
  flex: 1;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #27ae60;
  margin-bottom: 4px;
}

.result-desc {
  font-size: 14px;
  color: #2c3e50;
  line-height: 1.4;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.student-count {
  color: #7f8c8d;
  font-size: 14px;
}

.student-list {
  max-height: 60vh;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #ecf0f1;
}

.student-item:last-child {
  border-bottom: none;
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
  font-size: 18px;
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

.student-id {
  font-size: 12px;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 8px;
  border-radius: 8px;
}

.student-major {
  font-size: 14px;
  color: #95a5a6;
  margin-bottom: 8px;
}

.student-stats {
  display: flex;
  gap: 12px;
}

.stat {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 8px;
  background: #f8f9fa;
}

.stat.score {
  color: #e74c3c;
  background: #fdedec;
}

.stat.count {
  color: #3498db;
  background: #ebf5fb;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close {
  font-size: 24px;
  color: #95a5a6;
  cursor: pointer;
}

.import-guide {
  margin-bottom: 24px;
}

.guide-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
}

.guide-desc {
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 20px;
}

.import-btn {
  width: 100%;
  font-size: 16px;
  padding: 16px;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-success {
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-success:hover {
  background: #229954;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #95a5a6;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
}
</style>