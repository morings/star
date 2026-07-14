const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const result = await db.collection('tags')
      .orderBy('createTime', 'desc')
      .get();
    return { code: 0, data: result.data, msg: '查询成功' };
  } catch (e) {
    console.error('todo_getTags error:', e);
    return { code: -1, msg: e.message };
  }
};
