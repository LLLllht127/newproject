/**
 * 编辑器页面主逻辑
 */
class Editor {
  constructor() {
    this.scene3D = null;
    this.template = null;
    this.exhibits = [];
    this.currentTemplate = null;
    this.uploadData = null;
    
    this.init();
  }

  /**
   * 初始化编辑器
   * 使用 requestAnimationFrame 确保 DOM 已完成布局，canvas 容器有真实尺寸
   */
  init() {
    // 检查 URL 参数
    const params = new URLSearchParams(window.location.search);
    const templateType = params.get('template');
    const isDraft = params.get('draft');

    // 延迟一帧，确保浏览器完成布局渲染，scene3d 容器有真实 clientWidth/clientHeight
    requestAnimationFrame(() => {
      // 初始化 3D 场景
      const container = document.getElementById('scene3d');
      this.scene3D = new Scene3D(container);
      
      // 初始化模板
      this.template = new Template(this.scene3D.scene);
      
      // 设置场景回调
      this.setupSceneCallbacks();

      // 加载模板或草稿
      if (isDraft) {
        this.loadDraft();
      } else if (templateType) {
        this.currentTemplate = templateType;
        this.template.load(templateType);
      } else {
        // 默认现代风格
        this.currentTemplate = 'modern';
        this.template.load('modern');
      }

      // 检查 URL 中的分享数据
      this.checkShareData();
      
      // 绑定 UI 事件
      this.bindEvents();

      // 强制触发一次 resize 以修正渲染器尺寸
      this.scene3D.onResize();
    });
  }

  /**
   * 绑定 UI 事件（延迟执行确保 DOM 已加载）
   */
  bindEvents() {
    // 返回按钮
    const btnBack = document.getElementById('btnBack');
    if (btnBack) btnBack.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // 保存按钮
    const btnSave = document.getElementById('btnSave');
    if (btnSave) btnSave.addEventListener('click', () => {
      this.saveDraft();
    });

    // 预览按钮
    const btnPreview = document.getElementById('btnPreview');
    if (btnPreview) btnPreview.addEventListener('click', () => {
      this.preview();
    });

    // 分享按钮
    const btnShare = document.getElementById('btnShare');
    if (btnShare) btnShare.addEventListener('click', () => {
      this.showShare();
    });

    // 上传展品按钮
    const btnUpload = document.getElementById('btnUpload');
    if (btnUpload) btnUpload.addEventListener('click', () => {
      this.showUploadModal();
    });

    // AI 布局按钮
    const btnAILayout = document.getElementById('btnAILayout');
    if (btnAILayout) btnAILayout.addEventListener('click', () => {
      this.applyAILayout();
    });

    // 上传弹窗关闭
    const btnCloseModal = document.getElementById('btnCloseModal');
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => {
      this.hideUploadModal();
    });

    const btnCancelUpload = document.getElementById('btnCancelUpload');
    if (btnCancelUpload) btnCancelUpload.addEventListener('click', () => {
      this.hideUploadModal();
    });

    // 分享弹窗关闭
    const btnCloseShare = document.getElementById('btnCloseShare');
    if (btnCloseShare) btnCloseShare.addEventListener('click', () => {
      this.hideShareModal();
    });

    // 属性面板关闭
    const btnClosePanel = document.getElementById('btnClosePanel');
    if (btnClosePanel) btnClosePanel.addEventListener('click', () => {
      this.hideExhibitPanel();
    });

    // 删除展品
    const btnDelete = document.getElementById('btnDelete');
    if (btnDelete) btnDelete.addEventListener('click', () => {
      this.deleteSelectedExhibit();
    });

    // 属性输入框事件
    this.bindPropertyInputs();

    // 上传区域事件
    this.setupUploadArea();

    // 复制分享链接
    const btnCopyLink = document.getElementById('btnCopyLink');
    if (btnCopyLink) btnCopyLink.addEventListener('click', () => {
      this.copyShareLink();
    });

    // 上传确认按钮
    const btnConfirmUpload = document.getElementById('btnConfirmUpload');
    if (btnConfirmUpload) btnConfirmUpload.addEventListener('click', () => {
      this.confirmUpload();
    });

    // 弹窗背景点击关闭
    const uploadBackdrop = document.getElementById('uploadBackdrop');
    if (uploadBackdrop) uploadBackdrop.addEventListener('click', () => this.hideUploadModal());

    const shareBackdrop = document.getElementById('shareBackdrop');
    if (shareBackdrop) shareBackdrop.addEventListener('click', () => this.hideShareModal());
  }

  /**
   * 设置场景回调
   */
  setupSceneCallbacks() {
    // 选择展品回调
    this.scene3D.setOnSelectCallback((exhibit) => {
      this.showExhibitPanel(exhibit);
    });

    // 取消选择回调
    this.scene3D.setOnDeselectCallback(() => {
      this.hideExhibitPanel();
    });

    // 面板更新回调
    this.scene3D.setOnUpdatePanelCallback((exhibit) => {
      if (exhibit) {
        this.updateExhibitPanel(exhibit);
      }
    });
  }

  /**
   * 检查分享数据
   */
  checkShareData() {
    const config = URLCodec.getFromURL();
    if (config) {
      console.log('加载分享数据:', config);
      
      if (config.template) {
        this.currentTemplate = config.template;
        this.template.load(config.template);
      }
      
      if (config.exhibits) {
        this.scene3D.loadConfig(config);
        // 同步 editor.exhibits 与 scene3D.exhibits
        this.exhibits = [...this.scene3D.exhibits];
        this.updateExhibitList();
      }
    }
  }

  /**
   * 加载草稿
   */
  loadDraft() {
    const draftData = Storage.loadDraft();
    if (draftData && draftData.config) {
      const config = draftData.config;
      
      if (config.template) {
        this.currentTemplate = config.template;
        this.template.load(config.template);
      }
      
      if (config.exhibits) {
        this.scene3D.loadConfig(config);
        // 同步 editor.exhibits 与 scene3D.exhibits，AI 布局依赖此数组
        this.exhibits = [...this.scene3D.exhibits];
        this.updateExhibitList();
      }
    }
  }


  /**
   * 绑定属性输入框事件
   */
  bindPropertyInputs() {
    ['exhibitName', 'exhibitDesc'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('change', () => {
          this.updateSelectedExhibit();
        });
      }
    });

    ['exhibitPosX', 'exhibitPosY', 'exhibitPosZ'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('change', () => {
          this.updateExhibitPosition();
        });
      }
    });

    ['exhibitRotY'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('change', () => {
          this.updateExhibitRotation();
        });
      }
    });

    ['exhibitScale'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        // 实时显示当前值
        input.addEventListener('input', () => {
          const valEl = document.getElementById('exhibitScaleVal');
          if (valEl) valEl.textContent = parseFloat(input.value).toFixed(1);
          this.updateExhibitScale();
        });
      }
    });
  }

  /**
   * 设置上传区域
   */
  setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    if (!uploadArea || !fileInput) return;

    // 点击上传
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });

    // 文件选择
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  /**
   * 处理文件选择
   */
  handleFileSelect(file) {
    console.log('文件类型:', file.type);
    console.log('文件大小:', file.size);
    
    // 验证文件类型
    if (!file.type.match(/^image\/(jpeg|png|jpg)$/i)) {
      alert('请上传 JPG 或 PNG 格式的图片');
      return;
    }

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    // 读取文件
    const reader = new FileReader();
    reader.onload = (e) => {
      // 压缩图片以减少存储体积
      this.compressImage(e.target.result, 800, 600, 0.8, (compressed) => {
        this.uploadData = {
          image: compressed,
          name: '',
          description: '',
          type: 'wall'
        };
        
        // 显示预览
        document.getElementById('previewImage').src = compressed;
        document.getElementById('uploadPreview').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
      });
    };
    reader.readAsDataURL(file);
  }

  /**
   * 压缩图片
   * @param {string} dataUrl - 原始图片 dataURL
   * @param {number} maxW - 最大宽度
   * @param {number} maxH - 最大高度
   * @param {number} quality - 压缩质量 0~1
   * @param {Function} callback - 回调(compressedDataUrl)
   */
  compressImage(dataUrl, maxW, maxH, quality, callback) {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      
      // 等比缩放
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      // 压缩失败则使用原图
      callback(dataUrl);
    };
    img.src = dataUrl;
  }

  /**
   * 显示上传弹窗
   */
  showUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
  }

  /**
   * 隐藏上传弹窗
   */
  hideUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    this.resetUploadForm();
  }

  /**
   * 重置上传表单
   */
  resetUploadForm() {
    this.uploadData = null;
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadName').value = '';
    document.getElementById('uploadDesc').value = '';
    document.getElementById('uploadType').value = 'wall';
    document.getElementById('fileInput').value = '';
  }

  /**
   * 确认上传展品
   */
  confirmUpload() {
    if (!this.uploadData || !this.uploadData.image) {
      alert('请选择图片');
      return;
    }

    this.uploadData.name = document.getElementById('uploadName').value || '未命名展品';
    this.uploadData.description = document.getElementById('uploadDesc').value;
    this.uploadData.type = document.getElementById('uploadType').value;

    // 创建展品
    const exhibit = this.scene3D.addExhibit(this.uploadData);
    this.exhibits.push(exhibit);
    
    // 更新列表
    this.updateExhibitList();

    // 关闭弹窗
    this.hideUploadModal();
  }

  // 绑定确认上传按钮（在 bindEvents 之后添加）
  addUploadConfirmListener() {
    document.getElementById('btnConfirmUpload').addEventListener('click', () => {
      this.confirmUpload();
    });
  }

  /**
   * 更新展品列表
   */
  updateExhibitList() {
    const listEl = document.getElementById('exhibitList');
    
    if (this.exhibits.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>暂无展品</p>
          <p class="hint">点击"上传展品"添加</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.exhibits.map((exhibit, index) => `
      <div class="exhibit-item ${this.scene3D.selectedExhibit === exhibit ? 'active' : ''}" 
           data-id="${exhibit.id}">
        <img class="exhibit-thumb" src="${exhibit.image}" alt="${exhibit.name}">
        <div class="exhibit-info">
          <div class="exhibit-name">${exhibit.name}</div>
          <div class="exhibit-type">${exhibit.type === 'wall' ? '墙面挂画' : '展台陈列'}</div>
        </div>
      </div>
    `).join('');

    // 绑定点击事件
    listEl.querySelectorAll('.exhibit-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const exhibit = this.exhibits.find(e => e.id === id);
        if (exhibit) {
          this.scene3D.selectExhibit(exhibit);
        }
      });
    });
  }

  /**
   * 显示属性面板
   */
  showExhibitPanel(exhibit) {
    const panel = document.getElementById('rightPanel');
    panel.style.display = 'flex';
    
    this.updateExhibitPanel(exhibit);
    this.updateExhibitList();
  }

  /**
   * 隐藏属性面板
   */
  hideExhibitPanel() {
    document.getElementById('rightPanel').style.display = 'none';
    this.scene3D.deselectExhibit();
    this.updateExhibitList();
  }

  /**
   * 更新属性面板显示
   */
  updateExhibitPanel(exhibit) {
    if (!exhibit || !exhibit.mesh) return;

    document.getElementById('exhibitName').value = exhibit.name;
    document.getElementById('exhibitDesc').value = exhibit.description;
    document.getElementById('exhibitPosX').value = exhibit.mesh.position.x.toFixed(2);
    document.getElementById('exhibitPosY').value = exhibit.mesh.position.y.toFixed(2);
    document.getElementById('exhibitPosZ').value = exhibit.mesh.position.z.toFixed(2);
    document.getElementById('exhibitRotY').value = Math.round(exhibit.mesh.rotation.y * 180 / Math.PI);
    const scaleVal = parseFloat(exhibit.scale.x).toFixed(1);
    document.getElementById('exhibitScale').value = scaleVal;
    const valEl = document.getElementById('exhibitScaleVal');
    if (valEl) valEl.textContent = scaleVal;
  }

  /**
   * 更新选中展品数据
   */
  updateSelectedExhibit() {
    const exhibit = this.scene3D.selectedExhibit;
    if (!exhibit) return;

    exhibit.updateProperties(
      document.getElementById('exhibitName').value,
      document.getElementById('exhibitDesc').value
    );
    
    this.updateExhibitList();
  }

  /**
   * 更新展品位置
   */
  updateExhibitPosition() {
    const exhibit = this.scene3D.selectedExhibit;
    if (!exhibit) return;

    const x = parseFloat(document.getElementById('exhibitPosX').value) || 0;
    const y = parseFloat(document.getElementById('exhibitPosY').value) || 0;
    const z = parseFloat(document.getElementById('exhibitPosZ').value) || 0;

    exhibit.updatePosition(new THREE.Vector3(x, y, z));
  }

  /**
   * 更新展品旋转
   */
  updateExhibitRotation() {
    const exhibit = this.scene3D.selectedExhibit;
    if (!exhibit) return;

    const y = parseFloat(document.getElementById('exhibitRotY').value) || 0;
    const rad = y * Math.PI / 180;

    exhibit.updateRotation(new THREE.Vector3(0, rad, 0));
  }

  /**
   * 更新展品缩放
   */
  updateExhibitScale() {
    const exhibit = this.scene3D.selectedExhibit;
    if (!exhibit) return;

    const scale = parseFloat(document.getElementById('exhibitScale').value) || 1;
    exhibit.updateScale(scale);
  }

  /**
   * 删除选中展品
   */
  deleteSelectedExhibit() {
    const exhibit = this.scene3D.selectedExhibit;
    if (!exhibit) return;

    if (!confirm('确定要删除这个展品吗？')) return;

    this.scene3D.removeExhibit(exhibit);
    const index = this.exhibits.indexOf(exhibit);
    if (index > -1) {
      this.exhibits.splice(index, 1);
    }
    
    this.hideExhibitPanel();
  }

  /**
   * 应用 AI 布局
   */
  applyAILayout() {
    if (this.exhibits.length === 0) {
      this.showToast('请先上传展品', 'error');
      return;
    }

    const aiLayout = new AILayout(this.scene3D, this.template);
    aiLayout.layout(this.exhibits);
    
    // 布局完成后刷新属性面板
    if (this.scene3D.selectedExhibit) {
      this.updateExhibitPanel(this.scene3D.selectedExhibit);
    }
    this.showToast('AI 布局已应用');
  }

  /**
   * 保存草稿
   */
  saveDraft() {
    const config = {
      template: this.currentTemplate,
      exhibits: this.scene3D.getConfig().exhibits
    };

    if (Storage.saveDraft(config)) {
      this.showToast('已保存到本地');
    } else {
      this.showToast('保存失败', 'error');
    }
  }

  /**
   * 预览展厅
   */
  preview() {
    const config = {
      template: this.currentTemplate,
      exhibits: this.scene3D.getConfig().exhibits
    };

    // 保存到临时存储，并记录来源
    sessionStorage.setItem('preview_config', JSON.stringify(config));
    sessionStorage.setItem('preview_from_editor', '1');
    
    // 跳转到预览页面（避免弹窗拦截）
    window.location.href = 'viewer.html?preview=1';
  }

  /**
   * 显示分享弹窗
   */
  showShare() {
    const config = {
      template: this.currentTemplate,
      exhibits: this.scene3D.getConfig().exhibits
    };

    const url = URLCodec.generateShareURL(config);
    
    if (url) {
      document.getElementById('shareLink').value = url;
      document.getElementById('shareModal').style.display = 'flex';
    } else {
      this.showToast('生成分享链接失败', 'error');
    }
  }

  /**
   * 隐藏分享弹窗
   */
  hideShareModal() {
    document.getElementById('shareModal').style.display = 'none';
  }

  /**
   * 复制分享链接
   */
  copyShareLink() {
    const input = document.getElementById('shareLink');
    input.select();
    document.execCommand('copy');
    this.showToast('已复制到剪贴板');
  }

  /**
   * 显示提示消息（Toast 通知）
   */
  showToast(message, type = 'success') {
    // 移除已有 toast
    const existing = document.querySelector('.editor-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'editor-toast editor-toast--' + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 自动消失
    setTimeout(() => {
      toast.classList.add('editor-toast--hide');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.editor = new Editor();
});
