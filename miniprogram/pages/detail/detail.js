// pages/detail/detail.js
const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML', 'Vue', 'CSS', 'Shell', 'Java', 'Go', 'C++', 'Other'];

Page({
  data: {
    record: {},
    loading: true,
    isEditing: false,
    editForm: { title: '', desc: '' },
    allTags: [],   // 所有标签（含 selected 状态）
    editCodeBlocks: [],   // 编辑模式下的代码块
    languages: LANGUAGES
  },

  onLoad(options) {
    this.recordId = options.id;
    if (!this.recordId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.loadRecord();
  },

  onShow() {
    if (this.recordId && !this.data.loading) {
      this.loadRecord();
    }
  },

  loadRecord() {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'todo_getRecords',
      data: { pageSize: 200 }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        const list = res.result.data || [];
        const record = list.find(item => item._id === this.recordId);
        if (record) {
          record.fmtCreateTime = this.formatTime(record.createTime);
          record.fmtCompletedTime = this.formatTime(record.completedTime);
          this.setData({ record, loading: false });
        } else {
          wx.showToast({ title: '记录不存在', icon: 'none' });
          wx.navigateBack();
        }
      } else {
        this.setData({ loading: false });
      }
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = n => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  // ========== 编辑相关 ==========
  onStartEdit() {
    const { title, desc, tags, codeBlocks } = this.data.record;
    // tags 现在是 [{_id, name}, ...] 对象数组
    const tagIds = (tags || []).map(t => t._id || t);
    this.setData({
      isEditing: true,
      editForm: { title: title || '', desc: desc || '' },
      editCodeBlocks: (codeBlocks && codeBlocks.length > 0)
        ? codeBlocks.map(b => ({ language: b.language || 'JavaScript', content: b.content || '' }))
        : []
    });
    this.loadAllTags(tagIds);
  },

  loadAllTags(selectedTagIds) {
    wx.cloud.callFunction({
      name: 'todo_getTags'
    }).then(res => {
      if (res.result && res.result.code === 0) {
        const tagSet = new Set(selectedTagIds);
        const allTags = (res.result.data || []).map(t => ({
          ...t,
          selected: tagSet.has(t._id)
        }));
        this.setData({ allTags });
      }
    });
  },

  onEditTitle(e) {
    this.setData({ 'editForm.title': e.detail.value });
  },

  onEditDesc(e) {
    this.setData({ 'editForm.desc': e.detail.value });
  },

  onToggleTag(e) {
    const id = e.currentTarget.dataset.id;
    const allTags = this.data.allTags.map(t => {
      if (t._id === id) return { ...t, selected: !t.selected };
      return t;
    });
    this.setData({ allTags });
  },

  onCancelEdit() {
    this.setData({ isEditing: false });
  },

  onSaveEdit() {
    const { editForm, allTags, editCodeBlocks } = this.data;
    const title = editForm.title.trim();
    if (!title) {
      wx.showToast({ title: '标题不能为空', icon: 'none' });
      return;
    }
    const tagIds = allTags.filter(t => t.selected).map(t => t._id);
    // 过滤空内容代码块
    const validBlocks = editCodeBlocks.filter(b => b.content.trim());
    wx.cloud.callFunction({
      name: 'todo_updateRecord',
      data: { id: this.recordId, title, desc: editForm.desc.trim(), tagIds, codeBlocks: validBlocks }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ isEditing: false });
        this.loadRecord();
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || '保存失败', icon: 'none' });
      }
    });
  },

  // ========== 编辑-代码块 ==========
  onEditAddCodeBlock() {
    const blocks = [...this.data.editCodeBlocks, { language: 'JavaScript', content: '' }];
    this.setData({ editCodeBlocks: blocks });
  },

  onEditRemoveCodeBlock(e) {
    const idx = e.currentTarget.dataset.index;
    const block = this.data.editCodeBlocks[idx];
    if (block && block.content.trim()) {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个代码块吗？',
        success: (res) => {
          if (res.confirm) {
            const blocks = [...this.data.editCodeBlocks];
            blocks.splice(idx, 1);
            this.setData({ editCodeBlocks: blocks });
          }
        }
      });
    } else {
      const blocks = [...this.data.editCodeBlocks];
      blocks.splice(idx, 1);
      this.setData({ editCodeBlocks: blocks });
    }
  },

  onEditCodeLangChange(e) {
    const { index, lang } = e.currentTarget.dataset;
    this.setData({ [`editCodeBlocks[${index}].language`]: lang });
  },

  onEditCodeContentInput(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ [`editCodeBlocks[${idx}].content`]: e.detail.value });
  },

  // 全屏查看（查看模式）
  onViewFullscreenCode(e) {
    const idx = e.currentTarget.dataset.index;
    const block = this.data.record.codeBlocks[idx];
    wx.navigateTo({
      url: '/pages/code-editor/code-editor',
      success: (res) => {
        res.eventChannel.emit('init', {
          index: idx,
          content: block.content,
          language: block.language,
          readonly: true
        });
      }
    });
  },

  // 全屏编辑（编辑模式）
  onEditFullscreenCode(e) {
    const idx = e.currentTarget.dataset.index;
    const block = this.data.editCodeBlocks[idx];
    wx.navigateTo({
      url: '/pages/code-editor/code-editor',
      events: {
        onSave: (data) => {
          this.setData({
            [`editCodeBlocks[${data.index}].content`]: data.content,
            [`editCodeBlocks[${data.index}].language`]: data.language
          });
        }
      },
      success: (res) => {
        res.eventChannel.emit('init', {
          index: idx,
          content: block.content,
          language: block.language,
          readonly: false
        });
      }
    });
  },

  // ========== 完成 / 删除 ==========
  onToggleComplete() {
    const { isCompleted } = this.data.record;
    const willComplete = !isCompleted;
    wx.showModal({
      title: willComplete ? '标记完成' : '撤销完成',
      content: willComplete ? '确认将该记录标记为已完成？' : '确认撤销完成状态？',
      success: (resp) => {
        if (!resp.confirm) return;
        this.doComplete(willComplete);
      }
    });
  },

  doComplete(willComplete) {
    const { _id } = this.data.record;
    wx.cloud.callFunction({
      name: 'todo_updateRecord',
      data: { id: _id, isCompleted: willComplete }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        if (willComplete) {
          wx.showToast({ title: '已完成', icon: 'success' });
          setTimeout(() => { wx.navigateBack(); }, 800);
        } else {
          this.loadRecord();
        }
      } else {
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    });
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      success: (resp) => {
        if (resp.confirm) {
          wx.cloud.callFunction({
            name: 'todo_deleteRecord',
            data: { id: this.data.record._id }
          }).then(res => {
            if (res.result && res.result.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' });
              wx.navigateBack();
            } else {
              wx.showToast({ title: '删除失败', icon: 'none' });
            }
          });
        }
      }
    });
  }
});
