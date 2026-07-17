// pages/add/add.js
const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML', 'Vue', 'CSS', 'Shell', 'Java', 'Go', 'C++', 'Other'];
const { mdToHtml } = require('../../utils/md.js');

Page({
  data: {
    title: '',
    desc: '',
    descFormat: 'plain',     // 'plain' | 'markdown'
    descPreviewing: false,   // markdown 模式下是否正在预览
    descHtml: '',
    tags: [],
    selectedTagIds: [],
    codeBlocks: [],
    languages: LANGUAGES
  },

  onShow() { this.loadTags(); },

  loadTags() {
    wx.cloud.callFunction({ name: 'todo_getTags' }).then(res => {
      if (res.result && res.result.code === 0) {
        this.setData({ tags: res.result.data });
        this.refreshTagSelected();
      }
    }).catch(err => { console.error('加载标签失败:', err); });
  },

  refreshTagSelected() {
    const { tags, selectedTagIds } = this.data;
    const tagSet = new Set(selectedTagIds);
    const merged = tags.map(t => ({ ...t, selected: tagSet.has(t._id) }));
    this.setData({ tags: merged });
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },

  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  onToggleDescFormat() {
    const fmt = this.data.descFormat === 'markdown' ? 'plain' : 'markdown';
    this.setData({ descFormat: fmt, descPreviewing: false, descHtml: '' });
  },

  onToggleDescPreview() {
    const previewing = !this.data.descPreviewing;
    if (previewing) {
      const html = mdToHtml(this.data.desc || '');
      this.setData({ descPreviewing: true, descHtml: html });
    } else {
      this.setData({ descPreviewing: false });
    }
  },

  onToggleTag(e) {
    const id = e.currentTarget.dataset.id;
    const selectedTagIds = [...this.data.selectedTagIds];
    const idx = selectedTagIds.indexOf(id);
    if (idx > -1) selectedTagIds.splice(idx, 1);
    else selectedTagIds.push(id);
    this.setData({ selectedTagIds }, () => this.refreshTagSelected());
  },

  onQuickAddTag() {
    wx.showModal({
      title: '新建标签', editable: true, placeholderText: '请输入标签名称',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          wx.cloud.callFunction({ name: 'todo_addTag', data: { name: res.content.trim() } }).then(result => {
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '标签创建成功', icon: 'success' });
              this.loadTags();
            } else {
              wx.showToast({ title: (result.result && result.result.msg) || '创建失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // ========== 代码块 ==========
  onAddCodeBlock() {
    this.setData({ codeBlocks: [...this.data.codeBlocks, { language: 'JavaScript', content: '' }] });
  },
  onRemoveCodeBlock(e) {
    const idx = e.currentTarget.dataset.index;
    const block = this.data.codeBlocks[idx];
    if (block && block.content.trim()) {
      wx.showModal({
        title: '确认删除', content: '确定要删除这个代码块吗？',
        success: (res) => { if (res.confirm) { const a = [...this.data.codeBlocks]; a.splice(idx, 1); this.setData({ codeBlocks: a }); } }
      });
    } else { const a = [...this.data.codeBlocks]; a.splice(idx, 1); this.setData({ codeBlocks: a }); }
  },
  onCodeLangChange(e) {
    const { index, lang } = e.currentTarget.dataset;
    this.setData({ [`codeBlocks[${index}].language`]: lang });
  },
  onCodeContentInput(e) {
    this.setData({ [`codeBlocks[${e.currentTarget.dataset.index}].content`]: e.detail.value });
  },
  onFullscreenCodeBlock(e) {
    const idx = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: '/pages/code-editor/code-editor',
      events: { onSave: (data) => { this.setData({ [`codeBlocks[${data.index}].content`]: data.content, [`codeBlocks[${data.index}].language`]: data.language }); } },
      success: (res) => { res.eventChannel.emit('init', { index: idx, content: this.data.codeBlocks[idx].content, language: this.data.codeBlocks[idx].language, readonly: false }); }
    });
  },

  // 提交记录
  onSubmit() {
    const { title, desc, descFormat, selectedTagIds, codeBlocks } = this.data;
    if (!title.trim()) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    if (selectedTagIds.length === 0) { wx.showToast({ title: '请至少选择一个标签', icon: 'none' }); return; }
    const validBlocks = codeBlocks.filter(b => b.content.trim());
    wx.cloud.callFunction({
      name: 'todo_addRecord',
      data: { title: title.trim(), tagIds: selectedTagIds, desc: desc.trim(), descFormat, codeBlocks: validBlocks }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.setData({ title: '', desc: '', descFormat: 'plain', descHtml: '', selectedTagIds: [], codeBlocks: [] });
        setTimeout(() => { wx.switchTab({ url: '/pages/index/index' }); }, 800);
      } else { wx.showToast({ title: (res.result && res.result.msg) || '添加失败', icon: 'none' }); }
    }).catch(err => { console.error('添加记录失败:', err); wx.showToast({ title: '添加失败，请重试', icon: 'none' }); });
  },
});
