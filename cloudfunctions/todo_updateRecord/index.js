const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { id, isCompleted, title, tags, tagIds, desc, descFormat, codeBlocks } = event;
  const finalTagIds = tagIds || tags;
  if (!id) {
    return { code: -1, msg: '记录ID不能为空' };
  }
  try {
    const updateData = {};

    if (isCompleted !== undefined) {
      updateData.isCompleted = !!isCompleted;
      updateData.completedTime = isCompleted ? Date.now() : null;
    }
    if (title !== undefined) updateData.title = title;
    if (finalTagIds !== undefined) updateData.tags = finalTagIds;
    if (desc !== undefined) updateData.desc = desc;
    if (descFormat !== undefined) updateData.descFormat = descFormat;
    if (codeBlocks !== undefined) updateData.codeBlocks = codeBlocks;

    await db.collection('records').doc(id).update({ data: updateData });
    return { code: 0, msg: '更新成功' };
  } catch (e) {
    console.error('todo_updateRecord error:', e);
    return { code: -1, msg: e.message };
  }
};
