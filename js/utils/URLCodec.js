/**
 * URL 编解码工具类
 * 用于将展厅配置编码到 URL 哈希中
 */
class URLCodec {
  /**
   * 编码展厅配置到 URL 哈希
   * @param {Object} config - 展厅配置对象
   * @returns {string} 编码后的 URL 哈希
   */
  static encode(config) {
    try {
      // 1. JSON 序列化
      const json = JSON.stringify(config);
      
      // 2. 使用 LZ-String 压缩
      const compressed = LZString.compress(json);
      
      // 3. Base64 编码并转换为 URL 安全格式
      const base64 = btoa(unescape(encodeURIComponent(compressed)));
      const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      return urlSafe;
    } catch (e) {
      console.error('编码失败:', e);
      return null;
    }
  }

  /**
   * 从 URL 哈希解码展厅配置
   * @param {string} hash - URL 哈希字符串
   * @returns {Object|null} 展厅配置对象
   */
  static decode(hash) {
    try {
      if (!hash || hash.length < 2) return null;
      
      // 1. 恢复 Base64 格式
      let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
      
      // 2. 补充填充字符
      while (base64.length % 4) {
        base64 += '=';
      }
      
      // 3. Base64 解码
      const compressed = decodeURIComponent(escape(atob(base64)));
      
      // 4. 使用 LZ-String 解压
      const json = LZString.decompress(compressed);
      
      if (!json) return null;
      
      // 5. JSON 解析
      return JSON.parse(json);
    } catch (e) {
      console.error('解码失败:', e);
      return null;
    }
  }

  /**
   * 从当前 URL 获取展厅数据
   * @returns {Object|null}
   */
  static getFromURL() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    
    // 解析哈希参数
    const params = new URLSearchParams(hash);
    const data = params.get('data');
    
    if (data) {
      return this.decode(data);
    }
    
    // 兼容旧格式：直接是编码数据
    if (hash.startsWith('ey')) {
      return this.decode(hash);
    }
    
    return null;
  }

  /**
   * 生成分享链接
   * @param {Object} config - 展厅配置对象
   * @returns {string} 完整分享 URL
   */
  static generateShareURL(config) {
    const encoded = this.encode(config);

    if (!encoded) {
      console.error('编码失败，无法生成分享链接');
      return null;
    }

    // 生成 viewer.html 的相对路径（基于当前 URL 路径深度）
    // 保证分享链接在任何部署环境（本地/GitHub Pages/其他静态托管）下都能正常工作
    const pathname = window.location.pathname;
    // 从当前路径往上追溯到 viewer.html 的相对路径
    // 例：/editor.html       → viewer.html
    // 例：/project/editor.html → ../viewer.html
    // 例：/a/b/c/editor.html  → ../../viewer.html
    const segments = pathname.split('/').filter(Boolean); // 去掉空字符串
    // segments 如 ['a', 'b', 'c', 'editor.html']，去掉最后一项得 ['a','b','c']
    // 需要往上走 len-1 步
    const depth = Math.max(0, segments.length - 1);
    const relativePath = depth === 0 ? 'viewer.html' : '../'.repeat(depth) + 'viewer.html';

    const shareUrl = `${relativePath}#data=${encoded}`;

    // 检查 URL 长度
    if (shareUrl.length > 2000) {
      console.warn('URL 长度超过 2000 字符，可能无法在某些浏览器中正常工作');
    }

    return shareUrl;
  }
}
