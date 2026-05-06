/**
 * 本地存储工具类
 * 用于管理展厅草稿的本地存储
 */
class Storage {
  static KEY_DRAFT = 'museum_exhibition_draft';
  static KEY_SETTINGS = 'museum_exhibition_settings';

  /**
   * 保存展厅草稿
   * @param {Object} config - 展厅配置对象
   */
  static saveDraft(config) {
    try {
      const data = {
        config: config,
        updatedAt: Date.now()
      };
      localStorage.setItem(this.KEY_DRAFT, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('保存草稿失败:', e);
      return false;
    }
  }

  /**
   * 加载展厅草稿
   * @returns {Object|null} 展厅配置对象或 null
   */
  static loadDraft() {
    try {
      const data = localStorage.getItem(this.KEY_DRAFT);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error('加载草稿失败:', e);
      return null;
    }
  }

  /**
   * 清除展厅草稿
   */
  static clearDraft() {
    try {
      localStorage.removeItem(this.KEY_DRAFT);
      return true;
    } catch (e) {
      console.error('清除草稿失败:', e);
      return false;
    }
  }

  /**
   * 检查是否有草稿
   * @returns {boolean}
   */
  static hasDraft() {
    return this.loadDraft() !== null;
  }

  /**
   * 获取草稿更新时间
   * @returns {Date|null}
   */
  static getDraftUpdateTime() {
    const data = this.loadDraft();
    if (!data || !data.updatedAt) return null;
    return new Date(data.updatedAt);
  }

  /**
   * 格式化时间显示
   * @param {Date} date
   * @returns {string}
   */
  static formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  /**
   * 保存设置
   * @param {Object} settings
   */
  static saveSettings(settings) {
    try {
      localStorage.setItem(this.KEY_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('保存设置失败:', e);
      return false;
    }
  }

  /**
   * 加载设置
   * @returns {Object|null}
   */
  static loadSettings() {
    try {
      const data = localStorage.getItem(this.KEY_SETTINGS);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error('加载设置失败:', e);
      return null;
    }
  }
}
