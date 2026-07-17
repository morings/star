/**
 * 轻量 Markdown → HTML 转换器
 * 覆盖常用语法，零依赖，适用于微信小程序 <rich-text> 渲染
 */
function mdToHtml(md) {
  if (!md) return '';
  const lines = md.split('\n');
  const result = [];
  const stack = [];       // 标签栈，用于闭合未收尾的 <ul>/<ol>/<blockquote>
  let codeBlock = '';     // 累积中的围栏代码块
  let inCode = false;

  function flushStack(stopAt) {
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (stopAt && top === stopAt) break;
      result.push('</' + top + '>');
      stack.pop();
    }
  }

  function peek() { return stack.length ? stack[stack.length - 1] : null; }

  function pushTag(tag) {
    result.push('<' + tag + '>');
    stack.push(tag);
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // ── 围栏代码块 ──
    if (!inCode && /^```/.test(trimmed)) {
      inCode = true;
      continue;
    }
    if (inCode) {
      if (/^```/.test(trimmed)) {
        result.push('<pre><code>' + escapeHtml(codeBlock.trimEnd()) + '</code></pre>');
        codeBlock = '';
        inCode = false;
      } else {
        codeBlock += raw + '\n';
      }
      continue;
    }

    // ── 空行：关闭列表/引用，产生空行 ──
    if (!trimmed) {
      flushStack(null);
      result.push('<br>');
      continue;
    }

    // ── 水平线 ──
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushStack(null);
      result.push('<hr>');
      continue;
    }

    // ── 引用 ──
    const qMatch = trimmed.match(/^>\s?(.*)/);
    if (qMatch) {
      if (peek() !== 'blockquote') {
        flushStack(null);
        pushTag('blockquote');
      }
      result.push('<p>' + parseInline(qMatch[1]) + '</p>');
      continue;
    }

    // ── 无序列表 ──
    const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (ulMatch) {
      if (peek() !== 'ul') { flushStack(null); pushTag('ul'); }
      result.push('<li>' + parseInline(ulMatch[1]) + '</li>');
      continue;
    }

    // ── 有序列表 ──
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      if (peek() !== 'ol') { flushStack(null); pushTag('ol'); }
      result.push('<li>' + parseInline(olMatch[1]) + '</li>');
      continue;
    }

    // ── 标题 ──
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
      flushStack(null);
      result.push('<h' + hMatch[1].length + '>' + parseInline(hMatch[2]) + '</h' + hMatch[1].length + '>');
      continue;
    }

    // ── 普通段落 ──
    flushStack(null);
    const prev = result[result.length - 1];
    if (prev && prev === '<br>') {
      // 两个 <br> 转为一个 <p> 分隔
      result.pop(); // 移除多余 br
    }
    result.push('<p>' + parseInline(trimmed) + '</p>');
  }

  // 收尾
  flushStack(null);

  return result.join('');
}

// ─── 行内解析 ───
function parseInline(text) {
  if (!text) return '';

  // 转义 HTML
  text = escapeHtml(text);

  // 图片 ![alt](url) —— 先于链接
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // 链接 [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 粗斜体 *** *** 或 ___ ___
  text = text.replace(/(\*{3}|_{3})(.+?)\1/g, '<strong><em>$2</em></strong>');

  // 粗体 ** ** 或 __ __
  text = text.replace(/(\*{2}|_{2})(.+?)\1/g, '<strong>$2</strong>');

  // 斜体 * * 或 _ _
  text = text.replace(/(\*{1}|_{1})(.+?)\1/g, '<em>$2</em>');

  // 删除线 ~~ ~~
  text = text.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // 行内代码 ` `
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  return text;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { mdToHtml };
