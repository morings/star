// pages/add/add.js
Page({
  data: {
    title: '',
    desc: '',
    tags: [],
    selectedTags: []
  },

  onShow() {
    this.loadTags();
  },

  // 加载已有标签列表
  loadTags() {
    wx.cloud.callFunction({
      name: 'todo_getTags'
    }).then(res => {
      if (res.result && res.result.code === 0) {
        this.setData({ tags: res.result.data });
        this.refreshTagSelected();
      }
    }).catch(err => {
      console.error('加载标签失败:', err);
    });
  },

  // 将 selectedTags 状态合并到 tags 数组中，方便 WXML 直接读取
  refreshTagSelected() {
    const { tags, selectedTags } = this.data;
    const tagSet = new Set(selectedTags);
    const merged = tags.map(t => ({ ...t, selected: tagSet.has(t.name) }));
    this.setData({ tags: merged });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  // 切换标签选中状态
  onToggleTag(e) {
    const name = e.currentTarget.dataset.name;
    const selectedTags = [...this.data.selectedTags];
    const idx = selectedTags.indexOf(name);
    if (idx > -1) {
      selectedTags.splice(idx, 1);
    } else {
      selectedTags.push(name);
    }
    this.setData({ selectedTags }, () => {
      this.refreshTagSelected();
    });
  },

  // 快速新建标签
  onQuickAddTag() {
    wx.showModal({
      title: '新建标签',
      editable: true,
      placeholderText: '请输入标签名称',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const name = res.content.trim();
          wx.cloud.callFunction({
            name: 'todo_addTag',
            data: { name }
          }).then(result => {
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

  // 提交记录
  onSubmit() {
    const { title, desc, selectedTags } = this.data;
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (selectedTags.length === 0) {
      wx.showToast({ title: '请至少选择一个标签', icon: 'none' });
      return;
    }
    wx.cloud.callFunction({
      name: 'todo_addRecord',
      data: {
        title: title.trim(),
        tags: selectedTags,
        desc: desc.trim()
      }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.setData({ title: '', desc: '', selectedTags: [] });
        // 跳转到记录列表页
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 800);
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || '添加失败', icon: 'none' });
      }
    }).catch(err => {
      console.error('添加记录失败:', err);
      wx.showToast({ title: '添加失败，请重试', icon: 'none' });
    });
  }
});
