// pages/code-editor/code-editor.js
Page({
  data: {
    content: '',
    language: 'JavaScript',
    index: 0,
    readonly: true,
    statusBarHeight: 0
  },

  onLoad() {
    // 获取状态栏高度，用于自定义导航栏的 padding-top
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight });

    // 通过 eventChannel 接收上一页传过来的数据
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.on('init', (data) => {
        this.setData({
          content: data.content || '',
          language: data.language || 'JavaScript',
          index: data.index !== undefined ? data.index : 0,
          readonly: !!data.readonly
        });
      });
    }
  },

  onInput(e) {
    this.setData({ content: e.detail.value });
  },

  onCopy() {
    wx.setClipboardData({
      data: this.data.content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  onSave() {
    // 通过 eventChannel 通知上一页
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.emit('onSave', {
        index: this.data.index,
        content: this.data.content,
        language: this.data.language
      });
    }
    wx.navigateBack();
  },

  onClose() {
    // 编辑模式下，有内容变更时二次确认
    wx.navigateBack();
  },

});
