const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { id, date, wake, meditate, read, write, exercise, reflection, goals } = event;
  if (!id) return { code: -1, msg: '记录ID不能为空' };

  try {
    // 确保集合存在
    try { await db.createCollection('reflects'); } catch (e) { /* 已存在则忽略 */ }

    // 如果改了日期，检查是否和其他记录冲突
    if (date) {
      const exist = await db.collection('reflects').where({ date }).get();
      if (exist.data && exist.data.length > 0 && exist.data[0]._id !== id) {
        return { code: -1, msg: '该日期已存在反思记录' };
      }
    }

    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (wake !== undefined) updateData.wake = wake;
    if (meditate !== undefined) updateData.meditate = meditate;
    if (read !== undefined) updateData.read = read;
    if (exercise !== undefined) updateData.exercise = exercise;
    if (write !== undefined) updateData.write = write;
    if (reflection !== undefined) updateData.reflection = reflection;
    if (goals !== undefined) updateData.goals = goals;
    updateData.updateTime = db.serverDate();

    await db.collection('reflects').doc(id).update({ data: updateData });
    return { code: 0, msg: '更新成功' };
  } catch (e) {
    console.error('reflect_updateRecord error:', e);
    return { code: -1, msg: e.message };
  }
};
