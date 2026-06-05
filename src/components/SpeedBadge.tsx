import type { SpeedLevel } from '../data/types';
import { SPEED_LABELS, SPEED_COLORS } from '../data/types';

interface Props {
  speed: SpeedLevel;
  size?: 'sm' | 'md';
}

export default function SpeedBadge({ speed, size = 'md' }: Props) {
  const color = SPEED_COLORS[speed];
  const label = SPEED_LABELS[speed];
  const fontSize = size === 'sm' ? 11 : 13;
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';

  return (
    <span style={{
      display: 'inline-block',
      background: color + '18',
      color,
      border: `1px solid ${color}44`,
      borderRadius: 'var(--radius-pill)',
      padding,
      fontSize,
      fontWeight: 400,
      fontFamily: 'var(--font-family)',
      letterSpacing: '-0.39px',
      fontFeatureSettings: '"tnum"',
      lineHeight: 1.4,
    }}>
      {label}
    </span>
  );
}
