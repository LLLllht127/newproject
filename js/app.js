/**
 * 应用入口 - 首页逻辑
 */
document.addEventListener('DOMContentLoaded', function() {
  // 检查草稿
  checkDraft();

  // 绑定模板选择事件
  bindTemplateSelection();

  // 绑定继续编辑事件
  bindContinueDraft();
});

/**
 * 检查并显示草稿
 */
function checkDraft() {
  const draftData = Storage.loadDraft();
  if (draftData && draftData.updatedAt) {
    const draftSection = document.getElementById('draftSection');
    const draftInfo = document.getElementById('draftInfo');
    const updateTime = Storage.formatTime(new Date(draftData.updatedAt));
    
    draftInfo.textContent = `最后编辑：${updateTime}`;
    draftSection.style.display = 'block';
  }
}

/**
 * 绑定模板选择事件
 */
function bindTemplateSelection() {
  const buttons = document.querySelectorAll('.select-template');
  buttons.forEach(button => {
    button.addEventListener('click', function() {
      const card = this.closest('.template-card');
      const template = card.dataset.template;
      createExhibition(template);
    });
  });
}

/**
 * 创建新展厅
 * @param {string} template - 模板类型
 */
function createExhibition(template) {
  // 清除旧草稿
  Storage.clearDraft();
  
  // 跳转到编辑器页面
  window.location.href = `editor.html?template=${template}`;
}

/**
 * 绑定继续编辑事件
 */
function bindContinueDraft() {
  const btn = document.getElementById('continueDraft');
  if (btn) {
    btn.addEventListener('click', function() {
      const draftData = Storage.loadDraft();
      if (draftData && draftData.config) {
        window.location.href = 'editor.html?draft=1';
      }
    });
  }
}
