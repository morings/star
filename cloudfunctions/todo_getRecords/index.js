const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { keyword, tag, tagId, isCompleted, completedTimeStart, completedTimeEnd, page = 1, pageSize = 50 } = event;
  try {
    // 先加载所有标签，用于后续筛选和解析
    const allTags = await db.collection('tags').get();
    const tagsList = allTags.data || [];
    const idToTag = {};    // tagId -> tagObj
    const nameToTag = {};  // tagName -> tagObj
    tagsList.forEach(t => {
      idToTag[t._id] = t;
      nameToTag[t.name] = t;
    });

    const conditions = [];

    // 标题关键字模糊搜索
    if (keyword) {
      conditions.push({
        title: db.RegExp({
          regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          options: 'i'
        })
      });
    }

    // 标签筛选（兼容旧 name 和新 id）
    const filterTagId = tagId || tag;
    if (filterTagId) {
      const tagObj = idToTag[filterTagId] || nameToTag[filterTagId];
      if (tagObj) {
        // 同时匹配 tag 的 _id 和 name，兼容旧数据
        conditions.push(_.or([
          { tags: tagObj._id },
          { tags: tagObj.name }
        ]));
      } else {
        // 如果找不到对应标签，直接按传入值匹配
        conditions.push({ tags: filterTagId });
      }
    }

    // 状态筛选
    if (isCompleted !== undefined) {
      conditions.push({ isCompleted: !!isCompleted });
    }

    // 完成时间范围筛选
    if (completedTimeStart || completedTimeEnd) {
      const completedTimeFilter = {};
      if (completedTimeStart) completedTimeFilter.$gte = completedTimeStart;
      if (completedTimeEnd) completedTimeFilter.$lte = completedTimeEnd;
      conditions.push({ completedTime: completedTimeFilter });
    }

    const where = conditions.length > 0 ? _.and(conditions) : {};

    const countResult = await db.collection('records').where(where).count();
    const total = countResult.total;

    const result = await db.collection('records')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    // 将 records 中的 tags 从 ID/name 解析为 {_id, name} 对象
    const data = result.data.map(record => {
      const resolved = (record.tags || []).map(t => {
        // 尝试按 ID 匹配，再按 name 匹配
        const found = idToTag[t] || nameToTag[t];
        return found ? { _id: found._id, name: found.name } : { name: t };
      });
      return { ...record, tags: resolved };
    });

    return {
      code: 0,
      data,
      total,
      msg: '查询成功'
    };
  } catch (e) {
    console.error('todo_getRecords error:', e);
    return { code: -1, msg: e.message };
  }
};
