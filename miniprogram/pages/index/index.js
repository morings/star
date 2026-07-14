// pages/index/index.js
Page({
  data: {
    keyword: '',
    filterTag: '',
    filterStatus: '',   // ''=全部, 'pending'=待完成, 'done'=已完成
    filterCompletedStart: '',  // 完成时间范围-起始
    filterCompletedEnd: '',    // 完成时间范围-截止
    tags: [],
    records: [],
    loading: true
  },

  onShow() {
    this.loadTags();
    this.loadRecords();
  },

  // 加载所有标签
  loadTags() {
    wx.cloud.callFunction({
      name: 'todo_getTags'
    }).then(res => {
      if (res.result && res.result.code === 0) {
        this.setData({ tags: res.result.data });
      }
    }).catch(err => {
      console.error('获取标签失败:', err);
    });
  },

  // 加载记录列表（支持关键字、标签、状态、完成时间筛选）
  loadRecords() {
    this.setData({ loading: true });
    const { keyword, filterTag, filterStatus, filterCompletedStart, filterCompletedEnd } = this.data;
    const params = {
      keyword: keyword || undefined,
      tag: filterTag || undefined
    };
    // 状态筛选
    if (filterStatus === 'pending') {
      params.isCompleted = false;
    } else if (filterStatus === 'done') {
      params.isCompleted = true;
      // 完成时间范围筛选（仅对已完成状态生效）
      if (filterCompletedStart) params.completedTimeStart = new Date(filterCompletedStart).getTime();
      if (filterCompletedEnd) params.completedTimeEnd = new Date(filterCompletedEnd + ' 23:59:59').getTime();
    }
    wx.cloud.callFunction({
      name: 'todo_getRecords',
      data: params
    }).then(res => {
      if (res.result && res.result.code === 0) {
        const records = (res.result.data || []).map(item => ({
          ...item,
          fmtCreateTime: this.formatTime(item.createTime),
          fmtCompletedTime: this.formatTime(item.completedTime)
        }));
        this.setData({ records, loading: false });
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || '查询失败', icon: 'none' });
        this.setData({ loading: false });
      }
    }).catch(err => {
      console.error('加载记录失败:', err);
      this.setData({ loading: false });
    });
  },

  // 时间格式化
  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = n => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 搜索确认
  onSearchConfirm() {
    this.loadRecords();
  },

  // 标签筛选
  onFilterTag(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ filterTag: tag }, () => {
      this.loadRecords();
    });
  },

  // 状态筛选切换
  onFilterStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ filterStatus: status }, () => {
      this.loadRecords();
    });
  },

  // 完成时间-起始
  onCompletedStartChange(e) {
    this.setData({ filterCompletedStart: e.detail.value });
  },
  // 完成时间-截止
  onCompletedEndChange(e) {
    this.setData({ filterCompletedEnd: e.detail.value });
  },
  // 应用完成时间筛选
  onTimeFilterConfirm() {
    this.loadRecords();
  },

  // 清空完成时间筛选条件
  onTimeFilterClear() {
    this.setData({ filterCompletedStart: '', filterCompletedEnd: '' }, () => {
      this.loadRecords();
    });
  },

  // 点击查看详情
  onViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
