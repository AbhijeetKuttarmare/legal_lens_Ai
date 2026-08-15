import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

function renderInline(text: string, color: string, boldColor: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <Text key={`${keyPrefix}-${i}`} style={{ color: boldColor, fontWeight: '700' }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={`${keyPrefix}-${i}`} style={{ color }}>
        {part}
      </Text>
    );
  });
}

// Renders the same small markdown subset as web's markdown.tsx (bold,
// paragraphs, bullet/numbered lists) — AI replies commonly use this and
// nothing more, so this mirrors that renderer rather than pulling in a full
// markdown library.
export default function Markdown({ text, color, boldColor }: { text: string; color: string; boldColor: string }) {
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  function flushList() {
    if (!listType || listItems.length === 0) {
      listItems = [];
      listType = null;
      return;
    }
    const items = listItems;
    const ordered = listType === 'ol';
    blocks.push(
      <View key={blocks.length} style={styles.list}>
        {items.map((item, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={[styles.bullet, { color }]}>{ordered ? `${i + 1}.` : '•'}</Text>
            <Text style={[styles.listItemText, { color }]}>
              {renderInline(item, color, boldColor, `li-${blocks.length}-${i}`)}
            </Text>
          </View>
        ))}
      </View>,
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
        <Text key={blocks.length} style={[styles.paragraph, { color }]}>
          {renderInline(line, color, boldColor, `p-${blocks.length}`)}
        </Text>,
      );
    }
  }
  flushList();
  return <>{blocks}</>;
}

const styles = StyleSheet.create({
  paragraph: { marginBottom: 8, lineHeight: 20 },
  list: { marginBottom: 8, gap: 4 },
  listItem: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  bullet: { lineHeight: 20 },
  listItemText: { flex: 1, lineHeight: 20 },
});
