// src/utils/sanitizeBlock.js
// Shared BlockNote block sanitizer — preserves all block types faithfully.
// Used by BlockNoteEditor (load-time) and useJournal (save-time).

/**
 * List of BlockNote block types that store data in props (url, caption, etc.)
 * rather than in content[]. Their `content` is always `undefined`.
 */
const EMBED_TYPES = new Set([
  'image', 'video', 'audio', 'file',
]);

/**
 * Sanitize a single inline-content item (text, link, etc.).
 */
function sanitizeInlineContent(item) {
  if (!item || typeof item !== 'object') return null;

  if (item.type === 'link') {
    return {
      type: 'link',
      href: item.href || '',
      content: Array.isArray(item.content)
        ? item.content.map(sanitizeInlineContent).filter(Boolean)
        : [],
    };
  }

  // Default: treat as text node
  return {
    type: item.type || 'text',
    text: String(item.text ?? ''),
    styles: item.styles && typeof item.styles === 'object' ? item.styles : {},
  };
}

/**
 * Sanitize a BlockNote content array (inline content).
 * Handles text nodes and link inline-content.
 */
function sanitizeContent(content) {
  if (!Array.isArray(content)) return [];
  return content.map(sanitizeInlineContent).filter(Boolean);
}

/**
 * Sanitize a single table cell.
 * BlockNote v0.46 uses { type: "tableCell", props: {...}, content: [...] } objects.
 * Older versions used flat InlineContent[][] arrays.
 */
function sanitizeTableCell(cell) {
  // v0.46 tableCell object: { type: "tableCell", props: {...}, content: [...] }
  if (cell && typeof cell === 'object' && cell.type === 'tableCell') {
    return {
      type: 'tableCell',
      props: sanitizeProps(cell.props),
      content: sanitizeContent(cell.content),
    };
  }
  // Legacy flat array of inline content
  if (Array.isArray(cell)) {
    return sanitizeContent(cell);
  }
  // String shorthand (BlockNote accepts plain strings for cells)
  if (typeof cell === 'string') {
    return cell;
  }
  return [];
}

/**
 * Sanitize tableContent (used by the "table" block type).
 * Handles both v0.46 TableCell objects and legacy InlineContent[][] arrays.
 */
function sanitizeTableContent(tc) {
  if (!tc || typeof tc !== 'object') return undefined;

  return {
    type: 'tableContent',
    ...(tc.columnWidths ? { columnWidths: tc.columnWidths } : {}),
    ...(tc.headerRows !== undefined ? { headerRows: tc.headerRows } : {}),
    ...(tc.headerCols !== undefined ? { headerCols: tc.headerCols } : {}),
    rows: Array.isArray(tc.rows)
      ? tc.rows.map(row => ({
          cells: Array.isArray(row.cells)
            ? row.cells.map(sanitizeTableCell)
            : [],
        }))
      : [],
  };
}

/**
 * Sanitize block props — copy all non-null/undefined values.
 */
function sanitizeProps(props) {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return {};
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== null && value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Sanitize a single BlockNote block, preserving its full structure
 * including children, tableContent, embeds, and links.
 *
 * @param {object} block — raw block from editor.document or from DB
 * @returns {object} — sanitized block safe for persistence and reload
 */
export function sanitizeBlock(block) {
  if (!block || typeof block !== 'object') {
    return {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      type: 'paragraph',
      props: {},
      content: [],
      children: [],
    };
  }

  const type = block.type || 'paragraph';

  const result = {
    id: block.id || crypto.randomUUID?.() || Math.random().toString(36),
    type,
    props: sanitizeProps(block.props),
  };

  // Table blocks store data in tableContent, not content
  if (type === 'table') {
    result.content = sanitizeTableContent(block.content);
  } else if (EMBED_TYPES.has(type)) {
    // Embed blocks (image, video, audio, file) have no inline content
    result.content = undefined;
  } else {
    // Normal blocks — inline content array
    result.content = sanitizeContent(block.content);
  }

  // Recurse into children (nested blocks — e.g., list items)
  result.children = Array.isArray(block.children)
    ? block.children.map(sanitizeBlock)
    : [];

  return result;
}

/**
 * Sanitize an entire BlockNote document (array of blocks).
 *
 * @param {any} content — raw content from editor or DB
 * @returns {object[]} — sanitized array, always at least one empty paragraph
 */
export function sanitizeDocument(content) {
  let arr;
  if (Array.isArray(content)) {
    arr = content;
  } else if (content && typeof content === 'object') {
    arr = [content];
  } else {
    arr = [];
  }

  const sanitized = arr.filter(Boolean).map(sanitizeBlock);
  if (sanitized.length === 0) {
    sanitized.push(sanitizeBlock(null));
  }
  return sanitized;
}

/**
 * Extract plain text from BlockNote JSON content.
 * Handles inline content, tableContent rows, and nested children.
 *
 * @param {object[]} blockNoteContent
 * @returns {string}
 */
export function extractPlainText(blockNoteContent) {
  if (!blockNoteContent || !Array.isArray(blockNoteContent)) return '';

  const extractInline = (items) => {
    if (!Array.isArray(items)) return '';
    let text = '';
    for (const item of items) {
      if (typeof item === 'string') {
        text += item;
      } else if (item?.type === 'link') {
        text += extractInline(item.content);
      } else if (item?.text) {
        text += item.text;
      }
    }
    return text;
  };

  const extractBlock = (block) => {
    if (!block) return '';
    let text = '';

    // Table content
    if (block.content && block.content.type === 'tableContent') {
      const rows = block.content.rows || [];
      for (const row of rows) {
        const cells = row.cells || [];
        const cellTexts = cells.map(cell => {
          // v0.46 tableCell object
          if (cell && typeof cell === 'object' && cell.type === 'tableCell') {
            return extractInline(cell.content);
          }
          // Legacy flat array
          if (Array.isArray(cell)) {
            return extractInline(cell);
          }
          // String shorthand
          if (typeof cell === 'string') return cell;
          return '';
        });
        text += cellTexts.join('\t') + '\n';
      }
    } else if (Array.isArray(block.content)) {
      text += extractInline(block.content) + '\n';
    }

    // Recurse into children
    if (Array.isArray(block.children)) {
      for (const child of block.children) {
        text += extractBlock(child);
      }
    }

    return text;
  };

  return blockNoteContent.map(extractBlock).join('').trim();
}
