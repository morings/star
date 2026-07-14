// pages/add/add.js
const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML', 'Vue', 'CSS', 'Shell', 'Java', 'Go', 'C++', 'Other'];

Page({
  data: {
    title: '',
    desc: '',
    tags: [],
    selectedTagIds: [],
    codeBlocks: [],   // [{ language: 'JavaScript', content: '' }]
    languages: LANGUAGES
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

  // 将 selectedTagIds 状态合并到 tags 数组中，方便 WXML 直接读取
  refreshTagSelected() {
    const { tags, selectedTagIds } = this.data;
    const tagSet = new Set(selectedTagIds);
    const merged = tags.map(t => ({ ...t, selected: tagSet.has(t._id) }));
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
    const id = e.currentTarget.dataset.id;
    const selectedTagIds = [...this.data.selectedTagIds];
    const idx = selectedTagIds.indexOf(id);
    if (idx > -1) {
      selectedTagIds.splice(idx, 1);
    } else {
      selectedTagIds.push(id);
    }
    this.setData({ selectedTagIds }, () => {
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

  // ========== 代码块 ==========
  onAddCodeBlock() {
    const codeBlocks = [...this.data.codeBlocks, { language: 'JavaScript', content: '' }];
    this.setData({ codeBlocks });
  },

  onRemoveCodeBlock(e) {
    const idx = e.currentTarget.dataset.index;
    const block = this.data.codeBlocks[idx];
    if (block && block.content.trim()) {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个代码块吗？',
        success: (res) => {
          if (res.confirm) {
            const codeBlocks = [...this.data.codeBlocks];
            codeBlocks.splice(idx, 1);
            this.setData({ codeBlocks });
          }
        }
      });
    } else {
      const codeBlocks = [...this.data.codeBlocks];
      codeBlocks.splice(idx, 1);
      this.setData({ codeBlocks });
    }
  },

  onCodeLangChange(e) {
    const { index, lang } = e.currentTarget.dataset;
    this.setData({ [`codeBlocks[${index}].language`]: lang });
  },

  onCodeContentInput(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ [`codeBlocks[${idx}].content`]: e.detail.value });
  },

  // 全屏编辑代码块
  onFullscreenCodeBlock(e) {
    const idx = e.currentTarget.dataset.index;
    const block = this.data.codeBlocks[idx];
    wx.navigateTo({
      url: '/pages/code-editor/code-editor',
      events: {
        onSave: (data) => {
          this.setData({
            [`codeBlocks[${data.index}].content`]: data.content,
            [`codeBlocks[${data.index}].language`]: data.language
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

  // 提交记录
  onSubmit() {
    const { title, desc, selectedTagIds, codeBlocks } = this.data;
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (selectedTagIds.length === 0) {
      wx.showToast({ title: '请至少选择一个标签', icon: 'none' });
      return;
    }
    // 过滤掉内容为空的代码块
    const validBlocks = codeBlocks.filter(b => b.content.trim());
    wx.cloud.callFunction({
      name: 'todo_addRecord',
      data: {
        title: title.trim(),
        tagIds: selectedTagIds,
        desc: desc.trim(),
        codeBlocks: validBlocks
      }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.setData({ title: '', desc: '', selectedTagIds: [], codeBlocks: [] });
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
