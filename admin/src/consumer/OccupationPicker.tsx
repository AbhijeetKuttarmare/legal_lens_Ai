import { useMemo, useState } from 'react';
import { OCCUPATION_CATEGORIES } from './occupations';

interface Props {
  value: string;
  onChange: (occupation: string) => void;
}

// Two-step picker (category, then occupation within it) instead of one long
// flat dropdown of 30+ options — see occupations.ts for the grouping.
export default function OccupationPicker({ value, onChange }: Props) {
  const initialCategory = useMemo(
    () => OCCUPATION_CATEGORIES.find((c) => c.occupations.includes(value))?.category || '',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [category, setCategory] = useState(initialCategory);

  const occupationsInCategory = OCCUPATION_CATEGORIES.find((c) => c.category === category)?.occupations || [];

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <select
        className="cw-input-plain"
        style={{ flex: 1, marginBottom: 0 }}
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          onChange('');
        }}
      >
        <option value="">Select field...</option>
        {OCCUPATION_CATEGORIES.map((c) => (
          <option key={c.category} value={c.category}>
            {c.category}
          </option>
        ))}
      </select>
      <select
        className="cw-input-plain"
        style={{ flex: 1, marginBottom: 0 }}
        value={value}
        disabled={!category}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{category ? 'Select occupation...' : '—'}</option>
        {occupationsInCategory.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
