// pages/reflect/reflect.js
let goalIdSeed = 0;

Page({
  data: {
    mode: 'view',       // 'view' | 'edit'
    record: null,        // 当前日期的反思记录（单个）
    displayDate: '',     // 导航显示的日期
    editingDate: '',     // 编辑中的日期
    form: {
      wake: { done: false, time: '', note: '' },
      meditate: { done: false, minutes: 0, note: '' },
      read: { done: false, minutes: 0, book: '', note: '' },
      write: { done: false, words: 0, topic: '', note: '' },
      exercise: { done: false, type: '', minutes: 0, note: '' },
      reflection: '',
      goals: []
    }
  },

  onLoad() {
    const now = new Date();
    const today = this.fmtDate(now);
    this.setData({ displayDate: today });
    this.loadRecord(today);
  },

  onShow() {
    if (this.data.mode === 'view') {
      this.loadRecord(this.data.displayDate);
    }
  },

  fmtDate(d) {
    const pad = n => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },

  // 加载指定日期的反思记录
  loadRecord(date) {
    wx.cloud.callFunction({
      name: 'reflect_getRecords',
      data: { date }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        const records = res.result.data || [];
        this.setData({ record: records.length > 0 ? records[0] : null, displayDate: date });
      }
    });
  },

  // ========== 日期导航 ==========
  onDateChange(e) {
    this.setData({ displayDate: e.detail.value });
    this.loadRecord(e.detail.value);
  },

  onPrev() {
    const d = new Date(this.data.displayDate);
    d.setDate(d.getDate() - 1);
    const date = this.fmtDate(d);
    this.setData({ displayDate: date });
    this.loadRecord(date);
  },

  onNext() {
    const d = new Date(this.data.displayDate);
    d.setDate(d.getDate() + 1);
    const date = this.fmtDate(d);
    this.setData({ displayDate: date });
    this.loadRecord(date);
  },

  onToday() {
    const date = this.fmtDate(new Date());
    this.setData({ displayDate: date });
    this.loadRecord(date);
  },

  // ========== 新建 / 编辑 ==========
  onNewRecord() {
    const date = this.data.displayDate;
    goalIdSeed = 0;
    this.setData({
      mode: 'edit',
      editingDate: date,
      form: {
        wake: { done: false, time: '', note: '' },
        meditate: { done: false, minutes: 0, note: '' },
        read: { done: false, minutes: 0, book: '', note: '' },
        write: { done: false, words: 0, topic: '', note: '' },
        exercise: { done: false, type: '', minutes: 0, note: '' },
        reflection: '',
        goals: []
      }
    });
  },

  onEditRecord() {
    const r = this.data.record;
    if (!r) return;
    goalIdSeed = 0;
    this.setData({
      mode: 'edit',
      editingDate: r.date,
      form: {
        wake: { done: r.wake ? r.wake.done : false, time: (r.wake && r.wake.time) || '', note: (r.wake && r.wake.note) || '' },
        meditate: { done: (r.meditate && r.meditate.done) || false, minutes: (r.meditate && r.meditate.minutes) || 0, note: (r.meditate && r.meditate.note) || '' },
        read: { done: (r.read && r.read.done) || false, minutes: (r.read && r.read.minutes) || 0, book: (r.read && r.read.book) || '', note: (r.read && r.read.note) || '' },
        write: { done: (r.write && r.write.done) || false, words: (r.write && r.write.words) || 0, topic: (r.write && r.write.topic) || '', note: (r.write && r.write.note) || '' },
        exercise: { done: (r.exercise && r.exercise.done) || false, type: (r.exercise && r.exercise.type) || '', minutes: (r.exercise && r.exercise.minutes) || 0, note: (r.exercise && r.exercise.note) || '' },
        reflection: r.reflection || '',
        goals: (r.goals || []).map(g => ({ ...g }))
      }
    });
  },

  // ========== 表单操作 ==========
  onToggleHabit(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}.done`]: !this.data.form[key].done });
  },

  onWakeTimeChange(e) {
    this.setData({ 'form.wake.time': e.detail.value });
  },

  onHabitNumber(e) {
    const { key, field } = e.currentTarget.dataset;
    this.setData({ [`form.${key}.${field}`]: parseInt(e.detail.value, 10) || 0 });
  },

  onHabitNote(e) {
    const key = e.currentTarget.dataset.key;
    const sub = e.currentTarget.dataset.sub || 'note';
    this.setData({ [`form.${key}.${sub}`]: e.detail.value });
  },

  onReflectionInput(e) {
    this.setData({ 'form.reflection': e.detail.value });
  },

  // ========== 每日目标操作 ==========
  onGoalInput(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ [`form.goals[${idx}].content`]: e.detail.value });
  },

  onAddGoal() {
    goalIdSeed++;
    const newGoal = { id: `g_${Date.now()}_${goalIdSeed}`, content: '', done: false };
    this.setData({ 'form.goals': [...this.data.form.goals, newGoal] });
  },

  onRemoveGoal(e) {
    const idx = e.currentTarget.dataset.index;
    const goals = this.data.form.goals.filter((_, i) => i !== idx);
    this.setData({ 'form.goals': goals });
  },

  onToggleGoal(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ [`form.goals[${idx}].done`]: !this.data.form.goals[idx].done });
  },

  onCancel() {
    this.setData({ mode: 'view' });
  },

  // ========== 查看模式快速切换 ==========
  // 切换五个习惯完成状态
  onQuickToggle(e) {
    const key = e.currentTarget.dataset.key;
    const record = this.data.record;
    if (!record) return;

    const done = !(record[key] && record[key].done);
    const update = {};
    update[key] = { ...(record[key] || {}), done };

    this.setData({ [`record.${key}.done`]: done });

    wx.cloud.callFunction({
      name: 'reflect_updateRecord',
      data: { id: record._id, ...update }
    });
  },

  // 切换每日目标完成状态
  onToggleGoalView(e) {
    const idx = e.currentTarget.dataset.index;
    const record = this.data.record;
    if (!record || !record.goals) return;

    const goals = [...record.goals];
    goals[idx] = { ...goals[idx], done: !goals[idx].done };

    this.setData({ 'record.goals': goals });

    wx.cloud.callFunction({
      name: 'reflect_updateRecord',
      data: { id: record._id, goals }
    });
  },

  // 保存
  onSave() {
    const { form, record } = this.data;
    const date = this.data.editingDate;

    if (record) {
      // 更新已有记录
      wx.cloud.callFunction({
        name: 'reflect_updateRecord',
        data: { id: record._id, date, ...form }
      }).then(res => {
        if (res.result && res.result.code === 0) {
          wx.showToast({ title: '更新成功', icon: 'success' });
          this.setData({ mode: 'view' });
          this.loadRecord(date);
        } else {
          wx.showToast({ title: res.result.msg || '更新失败', icon: 'none' });
        }
      });
    } else {
      // 新增记录
      wx.cloud.callFunction({
        name: 'reflect_addRecord',
        data: { date, ...form }
      }).then(res => {
        if (res.result && res.result.code === 0) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          this.setData({ mode: 'view' });
          this.loadRecord(date);
        } else {
          wx.showToast({ title: res.result.msg || '添加失败', icon: 'none' });
        }
      });
    }
  }
});
