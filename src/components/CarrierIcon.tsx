import type { Carrier } from '../data/types';
import { CARRIER_LABELS } from '../data/types';

const CARRIER_BG: Record<Carrier, string> = {
  rakuten: '#bf0000',
  docomo: '#e60012',
  au: '#e55c00',
  softbank: '#1a1a2e',
};

interface Props {
  carrier: Carrier;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function CarrierIcon({ carrier, size = 'md', showLabel = true }: Props) {
  const bg = CARRIER_BG[carrier];
  const dim = size === 'sm' ? 20 : 26;
  const fontSize = size === 'sm' ? 10 : 12;
  const labelSize = size === 'sm' ? 13 : 14;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize,
        fontWeight: 400,
        fontFamily: 'var(--font-family)',
        flexShrink: 0,
        letterSpacing: 0,
      }}>
        {CARRIER_LABELS[carrier][0]}
      </span>
      {showLabel && (
        <span style={{
          fontSize: labelSize,
          fontWeight: 300,
          color: 'var(--color-ink-secondary)',
          fontFamily: 'var(--font-family)',
          letterSpacing: '-0.15px',
        }}>
          {CARRIER_LABELS[carrier]}
        </span>
      )}
    </span>
  );
}
