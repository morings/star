const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { id, isCompleted, title, tags, tagIds, desc, codeBlocks } = event;
  const finalTagIds = tagIds || tags; // 兼容旧的 tags 参数
  if (!id) {
    return { code: -1, msg: '记录ID不能为空' };
  }
  try {
    const updateData = {};

    if (isCompleted !== undefined) {
      updateData.isCompleted = !!isCompleted;
      // 存普通数字时间戳，方便后续按完成时间范围查询（$gte/$lte）
      updateData.completedTime = isCompleted ? Date.now() : null;
    }
    if (title !== undefined) updateData.title = title;
    if (finalTagIds !== undefined) updateData.tags = finalTagIds;
    if (desc !== undefined) updateData.desc = desc;
    if (codeBlocks !== undefined) updateData.codeBlocks = codeBlocks;

    await db.collection('records').doc(id).update({
      data: updateData
    });
    return { code: 0, msg: '更新成功' };
  } catch (e) {
    console.error('todo_updateRecord error:', e);
    return { code: -1, msg: e.message };
  }
};
