const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { id } = event;
  if (!id) {
    return { code: -1, msg: '记录ID不能为空' };
  }
  try {
    await db.collection('records').doc(id).remove();
    return { code: 0, msg: '删除成功' };
  } catch (e) {
    console.error('todo_deleteRecord error:', e);
    return { code: -1, msg: e.message };
  }
};
