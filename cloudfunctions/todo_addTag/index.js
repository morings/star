const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { name } = event;
  if (!name || !name.trim()) {
    return { code: -1, msg: '标签名称不能为空' };
  }
  try {
    // 检查重复
    const exist = await db.collection('tags').where({ name: name.trim() }).count();
    if (exist.total > 0) {
      return { code: -1, msg: '标签已存在' };
    }
    const result = await db.collection('tags').add({
      data: {
        name: name.trim(),
        createTime: db.serverDate()
      }
    });
    return { code: 0, data: result, msg: '添加成功' };
  } catch (e) {
    console.error('todo_addTag error:', e);
    return { code: -1, msg: e.message };
  }
};
