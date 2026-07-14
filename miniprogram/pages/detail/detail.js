// pages/detail/detail.js
Page({
  data: {
    record: {},
    loading: true,
    isEditing: false,
    editForm: { title: '', desc: '' },
    allTags: []  // 所有标签（含 selected 状态）
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
    const { title, desc, tags } = this.data.record;
    this.setData({
      isEditing: true,
      editForm: { title: title || '', desc: desc || '' }
    });
    this.loadAllTags(tags || []);
  },

  loadAllTags(selectedTagNames) {
    wx.cloud.callFunction({
      name: 'todo_getTags'
    }).then(res => {
      if (res.result && res.result.code === 0) {
        const tagSet = new Set(selectedTagNames);
        const allTags = (res.result.data || []).map(t => ({
          ...t,
          selected: tagSet.has(t.name)
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
    const name = e.currentTarget.dataset.name;
    const allTags = this.data.allTags.map(t => {
      if (t.name === name) return { ...t, selected: !t.selected };
      return t;
    });
    this.setData({ allTags });
  },

  onCancelEdit() {
    this.setData({ isEditing: false });
  },

  onSaveEdit() {
    const { editForm, allTags } = this.data;
    const title = editForm.title.trim();
    if (!title) {
      wx.showToast({ title: '标题不能为空', icon: 'none' });
      return;
    }
    const tags = allTags.filter(t => t.selected).map(t => t.name);
    wx.cloud.callFunction({
      name: 'todo_updateRecord',
      data: { id: this.recordId, title, desc: editForm.desc.trim(), tags }
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
