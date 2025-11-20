export const util = {
  formatDate(date, format = 'MM-DD HH:mm') {
    if (!date) return '';
    
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');

    return format
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute);
  },

  showSuccess(message) {
    alert('✅ ' + message);
  },

  showError(message) {
    alert('❌ ' + message);
  },

  showLoading(message = '加载中...') {
    // 简单实现
    console.log('Loading: ', message);
  },

  hideLoading() {
    // 简单实现
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};