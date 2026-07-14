const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { keyword, tag, isCompleted, completedTimeStart, completedTimeEnd, page = 1, pageSize = 50 } = event;
  try {
    const where = {};

    // 标题关键字模糊搜索
    if (keyword) {
      where.title = db.RegExp({
        regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        options: 'i'
      });
    }

    // 标签筛选（tags 是数组，直接等值匹配即可匹配数组中包含该值的文档）
    if (tag) {
      where.tags = tag;
    }

    // 状态筛选
    if (isCompleted !== undefined) {
      where.isCompleted = !!isCompleted;
    }

    // 完成时间范围筛选
    if (completedTimeStart || completedTimeEnd) {
      const completedTimeFilter = {};
      if (completedTimeStart) completedTimeFilter.$gte = completedTimeStart;
      if (completedTimeEnd) completedTimeFilter.$lte = completedTimeEnd;
      where.completedTime = completedTimeFilter;
    }

    const countResult = await db.collection('records').where(where).count();
    const total = countResult.total;

    const result = await db.collection('records')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      code: 0,
      data: result.data,
      total,
      msg: '查询成功'
    };
  } catch (e) {
    console.error('todo_getRecords error:', e);
    return { code: -1, msg: e.message };
  }
};
