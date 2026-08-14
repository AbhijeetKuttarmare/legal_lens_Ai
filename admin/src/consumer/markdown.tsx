import { Fragment, ReactNode } from 'react';

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

// Renders a small subset of markdown (bold, paragraphs, bullet/numbered
// lists) that AI replies commonly use, using the cw-chat-p/cw-chat-list
// classes from consumer.css for consistent styling wherever it's used.
export function renderMessage(text: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  function flushList() {
    if (!listType || listItems.length === 0) {
      listItems = [];
      listType = null;
      return;
    }
    const ListTag = listType;
    blocks.push(
      <ListTag key={blocks.length} className="cw-chat-list">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ListTag>,
    );
    listItems = [];
    listType = null;
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    const numberedMatch = line.match(/^\d+[.)]\s+(.*)/);
    if (bulletMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(bulletMatch[1]);
    } else if (numberedMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(numberedMatch[1]);
    } else {
      flushList();
      blocks.push(
        <p key={blocks.length} className="cw-chat-p">
          {renderInline(line, `p-${blocks.length}`)}
        </p>,
      );
    }
  }
  flushList();
  return blocks;
}
