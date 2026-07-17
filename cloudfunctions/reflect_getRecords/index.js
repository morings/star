const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { date, month, pageSize = 100 } = event;
  try {
    // 确保集合存在，不存在则创建
    try {
      await db.createCollection('reflects');
    } catch (e) {
      // 集合已存在会报错，忽略
    }

    let query = db.collection('reflects');
    if (date) {
      query = query.where({ date });
    } else if (month) {
      query = query.where({ date: db.RegExp({ regexp: `^${month}`, options: 'i' }) });
    }
    const result = await query.orderBy('date', 'desc').limit(pageSize).get();
    return { code: 0, data: result.data, msg: '查询成功' };
  } catch (e) {
    console.error('reflect_getRecords error:', e);
    return { code: -1, msg: e.message };
  }
};
