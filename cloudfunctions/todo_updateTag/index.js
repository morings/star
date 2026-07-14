const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { id, name } = event;
  if (!id) return { code: -1, msg: '标签ID不能为空' };
  if (!name || !name.trim()) return { code: -1, msg: '标签名称不能为空' };

  try {
    // 检查与其他标签的重名
    const exist = await db.collection('tags').where({
      name: name.trim(),
      _id: _.neq(id)
    }).count();
    if (exist.total > 0) {
      return { code: -1, msg: '标签名已存在' };
    }
    await db.collection('tags').doc(id).update({
      data: { name: name.trim() }
    });
    return { code: 0, msg: '更新成功' };
  } catch (e) {
    console.error('todo_updateTag error:', e);
    return { code: -1, msg: e.message };
  }
};
