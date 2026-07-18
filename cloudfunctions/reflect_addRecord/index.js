const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { date, wake, meditate, read, write, exercise, reflection, goals } = event;
  if (!date) return { code: -1, msg: '日期不能为空' };

  try {
    // 确保集合存在
    try { await db.createCollection('reflects'); } catch (e) { /* 已存在则忽略 */ }

    // 同一天只能有一条反思记录
    const exist = await db.collection('reflects').where({ date }).get();
    if (exist.data && exist.data.length > 0) {
      return { code: -1, msg: '该日期已存在反思记录，请编辑已有记录' };
    }

    const result = await db.collection('reflects').add({
      data: {
        date,
        wake: wake || { done: false, time: '', note: '' },
        meditate: meditate || { done: false, minutes: 0, note: '' },
        read: read || { done: false, minutes: 0, book: '', note: '' },
        write: write || { done: false, words: 0, topic: '', note: '' },
        exercise: exercise || { done: false, type: '', minutes: 0, note: '' },
        reflection: reflection || '',
        goals: goals || [],
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    return { code: 0, data: result, msg: '添加成功' };
  } catch (e) {
    console.error('reflect_addRecord error:', e);
    return { code: -1, msg: e.message };
  }
};
