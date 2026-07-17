const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { title, tags, tagIds, desc, descFormat, codeBlocks } = event;
  const finalTagIds = tagIds || tags || [];
  if (!title || !title.trim()) {
    return { code: -1, msg: '标题不能为空' };
  }
  try {
    const result = await db.collection('records').add({
      data: {
        title: title.trim(),
        tags: finalTagIds,
        desc: desc || '',
        descFormat: descFormat || 'plain',
        codeBlocks: codeBlocks || [],
        isCompleted: false,
        completedTime: null,
        createTime: db.serverDate()
      }
    });
    return { code: 0, data: result, msg: '添加成功' };
  } catch (e) {
    console.error('todo_addRecord error:', e);
    return { code: -1, msg: e.message };
  }
};
