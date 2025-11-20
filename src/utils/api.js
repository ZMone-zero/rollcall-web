import config from './config.js';

class ApiService {
  async request(url, method = 'GET', data = null) {
    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(config.baseURL + url, options);
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  async importStudents(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(config.baseURL + config.api.importStudents, {
      method: 'POST',
      body: formData
    });
    
    return await response.json();
  }

  async getAllStudents() {
    return this.request(config.api.students);
  }

  async getStudentById(studentId) {
    return this.request(`${config.api.students}/${studentId}`);
  }

  async getScoreRanking(limit = 10) {
    return this.request(`${config.api.scoreRanking}?limit=${limit}`);
  }

  async randomRollcall() {
    return this.request(config.api.randomRollcall, 'POST');
  }

  async orderRollcall(currentIndex = 0) {
    return this.request(`${config.api.orderRollcall}?current_index=${currentIndex}`, 'POST');
  }

  async updateScore(studentId, scoreChange, reason) {
    return this.request(
      `${config.api.updateScore}?student_id=${studentId}&score_change=${scoreChange}&reason=${encodeURIComponent(reason)}`,
      'POST'
    );
  }

  async getRollcallHistory(limit = 50) {
    return this.request(`${config.api.rollcallHistory}?limit=${limit}`);
  }

  async getDebugCount() {
    return this.request(config.api.debugCount);
  }

  async resetData() {
    return this.request(config.api.resetData, 'DELETE');
  }

  // 在 ApiService 类中添加这个方法
  async exportScoreDetail() {
    try {
      const response = await fetch(config.baseURL + '/students/');
      const data = await response.json();
      
      if (data.students) {
        // 生成 CSV 内容
        const csvContent = this.generateCSV(data.students);
        
        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `学生积分详情_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return { success: true, message: '导出成功' };
      }
    } catch (error) {
      console.error('导出失败:', error);
      throw error;
    }
  }

  generateCSV(students) {
    const headers = ['学号', '姓名', '专业', '总积分', '随机点名次数', '出勤次数', '最后更新'];
    
    const headerRow = headers.join(',') + '\n';
    
    const dataRows = students.map(student => {
      return [
        student.student_id,
        student.name,
        student.major || '',
        student.total_score,
        student.random_count,
        student.attendance_count || 0,
        new Date(student.updated_at).toLocaleDateString()
      ].map(field => `"${field}"`).join(',');
    }).join('\n');
    
    return headerRow + dataRows;
  }
}
  

export default new ApiService();