// pages/tags/tags.js
Page({
  data: {
    tags: [],
    newTagName: ''
  },

  onShow() {
    this.loadTags();
  },

  // 加载标签列表
  loadTags() {
    wx.cloud.callFunction({
      name: 'todo_getTags'
    }).then(res => {
      if (res.result && res.result.code === 0) {
        this.setData({ tags: res.result.data });
      }
    }).catch(err => {
      console.error('加载标签失败:', err);
    });
  },

  onInputTag(e) {
    this.setData({ newTagName: e.detail.value });
  },

  // 添加标签
  onAddTag() {
    const name = this.data.newTagName.trim();
    if (!name) {
      wx.showToast({ title: '请输入标签名称', icon: 'none' });
      return;
    }
    wx.cloud.callFunction({
      name: 'todo_addTag',
      data: { name }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.setData({ newTagName: '' });
        this.loadTags();
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || '添加失败', icon: 'none' });
      }
    }).catch(err => {
      console.error('添加标签失败:', err);
    });
  },

  // 编辑标签
  onEditTag(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '编辑标签',
      editable: true,
      placeholderText: '请输入新名称',
      content: name,
      success: (res) => {
        if (res.confirm && res.content && res.content.trim() && res.content.trim() !== name) {
          wx.cloud.callFunction({
            name: 'todo_updateTag',
            data: { id, name: res.content.trim() }
          }).then(result => {
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '更新成功', icon: 'success' });
              this.loadTags();
            } else {
              wx.showToast({ title: (result.result && result.result.msg) || '更新失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 删除标签
  onDeleteTag(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除标签"${name}"吗？\n已使用此标签的记录不会受影响。`,
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'todo_deleteTag',
            data: { id }
          }).then(result => {
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadTags();
            } else {
              wx.showToast({ title: (result.result && result.result.msg) || '删除失败', icon: 'none' });
            }
          });
        }
      }
    });
  }
});
