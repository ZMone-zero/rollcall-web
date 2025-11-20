<!-- 注意本文件已废弃 不删是怕什么神秘地方又引用上了查一辈子 -->
<template>
  <div class="page">
    <!-- 过滤器 -->
    <div class="card">
      <div class="section-title">筛选条件</div>
      
      <div class="filter-group">
        <div class="filter-label">点名类型</div>
        <div class="filter-options">
          <button 
            v-for="type in rollTypes"
            :key="type.id"
            :class="['filter-btn', { active: filters.rollType === type.id }]"
            @click="setFilter('rollType', type.id)"
          >
            {{ type.name }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-label">时间范围</div>
        <div class="filter-options">
          <button 
            v-for="range in dateRanges"
            :key="range.id"
            :class="['filter-btn', { active: filters.dateRange === range.id }]"
            @click="setFilter('dateRange', range.id)"
          >
            {{ range.name }}
          </button>
        </div>
      </div>

      <button class="btn-secondary clear-filters" @click="clearFilters">
        清空筛选
      </button>
    </div>

    <!-- 统计信息 -->
    <div class="card" v-if="history.length > 0">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ getFilterStats().total }}</div>
          <div class="stat-label">总记录</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ getFilterStats().randomCount }}</div>
          <div class="stat-label">随机点名</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ getFilterStats().orderCount }}</div>
          <div class="stat-label">顺序点名</div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="card">
      <div class="list-header">
        <div class="section-title">点名历史</div>
        <div class="history-count" v-if="history.length > 0">
          {{ history.length }} 条记录
        </div>
      </div>

      <div class="loading" v-if="loading && history.length === 0">
        加载中...
      </div>

      <div class="empty-state" v-else-if="!loading && history.length === 0">
        <div class="empty-icon">📜</div>
        <div class="empty-text">暂无历史记录</div>
        <div class="empty-desc" v-if="hasActiveFilters">
          尝试调整筛选条件
        </div>
        <div class="empty-desc" v-else-if="history.length === 0 && hasActiveFilters">
          存在数据异常，请联系管理员
        </div>
      </div>

      <div class="history-list" v-else>
        <div 
          class="history-item" 
          v-for="record in history" 
          :key="record.id"
          v-if="record && record.student"
        >
          <div class="history-avatar">
             <div class="student-name">{{ record.student?.name || '未知学生' }}</div>
          </div>

          <div class="history-content">
            <div class="history-main">
              <div class="student-name">{{ record.student?.name || '未知学生' }}</div>
              <div :class="['history-type', record.roll_type]">
                {{ record.roll_type === 'random' ? '随机点名' : '顺序点名' }}
              </div>
            </div>
            
            <div class="history-details">
              <div class="student-id">{{ record.student?.student_id || '未知学号' }}</div>
              <div class="history-time">
                {{ util.formatDate(record.created_at) }}
              </div>
            </div>

            <div class="history-reason" v-if="record.reason && record.reason !== '随机点名' && record.reason !== '顺序点名'">
              {{ record.reason }}
              <span class="score-change" v-if="record.score_change !== 0">
                ({{ record.score_change > 0 ? '+' : '' }}{{ record.score_change }}分)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore && history.length > 0">
        <div class="load-more-text" @click="loadMore">
          {{ loading ? '加载中...' : '点击加载更多' }}
        </div>
      </div>

      <div class="no-more" v-if="!hasMore && history.length > 0">
        没有更多数据了
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api.js';
import { util } from '../utils/util.js';

export default {
  name: 'History',
  data() {
    return {
      history: [],
      loading: false,
      hasMore: true,
      page: 1,
      pageSize: 20,
      filters: {
        rollType: 'all',
        dateRange: 'all'
      },
      rollTypes: [
        { id: 'all', name: '全部' },
        { id: 'random', name: '随机点名' },
        { id: 'order', name: '顺序点名' }
      ],
      dateRanges: [
        { id: 'all', name: '全部' },
        { id: 'today', name: '今天' },
        { id: 'week', name: '最近一周' },
        { id: 'month', name: '最近一月' }
      ]
    };
  },

  computed: {
    hasActiveFilters() {
      return this.filters.rollType !== 'all' || this.filters.dateRange !== 'all';
    }
  },

  async mounted() {
    await this.loadHistory();
  },

  methods: {
    util,

    async loadHistory(loadMore = false) {
      if (!loadMore) {
        this.loading = true;
        this.page = 1;
      }

      try {
        const res = await api.getRollcallHistory(this.page * this.pageSize);
        
        if (res.success) {
          let history = res.records || [];
          
          // 为每条记录获取学生信息
          history = await this.enrichHistoryWithStudentInfo(history);
          
          history = this.applyFilters(history);
          
          if (loadMore) {
            history = [...this.history, ...history];
          }

          this.history = history;
          this.hasMore = history.length < (res.total || 0);
        }
      } catch (error) {
        console.error('加载历史记录失败:', error);
        util.showError('加载历史记录失败');
      } finally {
        this.loading = false;
      }
    },

    // 新增方法：为历史记录添加学生信息
    async enrichHistoryWithStudentInfo(records) {
      const enrichedRecords = [];
      
      for (const record of records) {
        try {
          // 如果记录中已经有完整的 student 对象，直接使用
          if (record.student && record.student.name) {
            enrichedRecords.push(record);
            continue;
          }
          
          // 否则根据 student_id 查询学生信息
          if (record.student_id) {
            const student = await api.getStudentById(record.student_id);
            if (student) {
              enrichedRecords.push({
                ...record,
                student: {
                  name: student.name,
                  student_id: student.student_id,
                  major: student.major
                }
              });
            } else {
              // 如果查询不到学生，创建占位信息
              enrichedRecords.push({
                ...record,
                student: {
                  name: '未知学生',
                  student_id: record.student_id,
                  major: ''
                }
              });
            }
          } else {
            // 没有 student_id 的记录
            enrichedRecords.push({
              ...record,
              student: {
                name: '未知学生',
                student_id: '未知',
                major: ''
              }
            });
          }
        } catch (error) {
          console.error('获取学生信息失败:', error);
          // 即使失败也保留记录
          enrichedRecords.push({
            ...record,
            student: {
              name: '加载失败',
              student_id: record.student_id || '未知',
              major: ''
            }
          });
        }
      }
      
      return enrichedRecords;
    },

    applyFilters(records) {
      let filtered = [...records];

      // 基本过滤：确保记录和学生信息存在
      filtered = filtered.filter(record => 
        record && record.student && record.student.name
      );

      if (this.filters.rollType !== 'all') {
        filtered = filtered.filter(record => record.roll_type === this.filters.rollType);
      }

      if (this.filters.dateRange !== 'all') {
        const now = new Date();
        let startDate;

        switch (this.filters.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        }

        filtered = filtered.filter(record => {
          const recordDate = new Date(record.created_at);
          return recordDate >= startDate;
        });
      }

      return filtered;
    },

    setFilter(type, value) {
      this.filters[type] = value;
      this.loadHistory();
    },

    async loadMore() {
      if (this.hasMore && !this.loading) {
        this.page += 1;
        await this.loadHistory(true);
      }
    },

    clearFilters() {
      this.filters = {
        rollType: 'all',
        dateRange: 'all'
      };
      this.loadHistory();
    },

    getFilterStats() {
      const total = this.history.length;
      const randomCount = this.history.filter(h => h.roll_type === 'random').length;
      const orderCount = this.history.filter(h => h.roll_type === 'order').length;

      return { total, randomCount, orderCount };
    }
  }
};
</script>

<style scoped>
.filter-group {
  margin-bottom: 20px;
}

.filter-label {
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 12px;
  font-weight: 500;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #e1e1e1;
  border-radius: 16px;
  background: white;
  color: #7f8c8d;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn.active {
  border-color: #3498db;
  background: #3498db;
  color: white;
}

.clear-filters {
  width: 100%;
  margin-top: 12px;
  font-size: 14px;
  padding: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 16px 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
}

.history-list {
  margin-top: 12px;
}

.history-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #ecf0f1;
}

.history-item:last-child {
  border-bottom: none;
}

.history-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.student-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.history-type {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.history-type.random {
  background: #e8f6f3;
  color: #27ae60;
}

.history-type.order {
  background: #fef9e7;
  color: #f39c12;
}

.history-details {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.student-id {
  font-size: 12px;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 8px;
  border-radius: 8px;
}

.history-time {
  font-size: 12px;
  color: #95a5a6;
}

.history-reason {
  font-size: 14px;
  color: #2c3e50;
  line-height: 1.4;
}

.score-change {
  color: #e74c3c;
  font-weight: bold;
  margin-left: 4px;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.load-more-text {
  color: #3498db;
  font-size: 14px;
  cursor: pointer;
}

.no-more {
  text-align: center;
  padding: 20px;
  color: #95a5a6;
  font-size: 14px;
}

.history-count {
  color: #7f8c8d;
  font-size: 14px;
}
</style>