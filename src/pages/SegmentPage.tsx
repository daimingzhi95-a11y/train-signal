import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { ALL_SEGMENTS, LINES } from '../data/mockData';
import { useAppStore } from '../store/appStore';
import SpeedBadge from '../components/SpeedBadge';
import CarrierIcon from '../components/CarrierIcon';
import type { Carrier, NetworkGeneration, SegmentPosition } from '../data/types';
import { CARRIER_LABELS } from '../data/types';

const CARRIERS: Carrier[] = ['rakuten', 'docomo', 'au', 'softbank'];
const GENS: NetworkGeneration[] = ['5G', '4G'];
const POSITIONS: { value: SegmentPosition; label: string }[] = [
  { value: 0, label: '起点（出発駅）' },
  { value: 25, label: '前段 25%' },
  { value: 50, label: '中間 50%' },
  { value: 75, label: '後段 75%' },
  { value: 100, label: '終点（到着駅）' },
];

export default function SegmentPage() {
  const { segmentId } = useParams<{ segmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const records = useAppStore((s) => s.speedRecords);
  const activeCarrier = (searchParams.get('carrier') ?? '') as Carrier | '';

  const segment = ALL_SEGMENTS.find((s) => s.id === segmentId);
  if (!segment) return <div style={{ padding: 32, color: 'var(--color-ink-mute)' }}>区間が見つかりません</div>;

  const line = LINES.find((l) => l.id === segment.lineId);
  const stationsById = Object.fromEntries((line?.stations ?? []).map((s) => [s.id, s]));
  const from = stationsById[segment.fromStationId];
  const to = stationsById[segment.toStationId];
  const approved = records.filter((r) => r.segmentId === segmentId && r.approved);

  const summary: Record<string, { carrier: Carrier; gen: NetworkGeneration; speeds: string[] }> = {};
  for (const r of approved) {
    const key = `${r.carrier}-${r.generation}`;
    if (!summary[key]) summary[key] = { carrier: r.carrier, gen: r.generation, speeds: [] };
    summary[key].speeds.push(r.speed);
  }

  const carrierBestCount: Record<Carrier, number> = { rakuten: 0, docomo: 0, au: 0, softbank: 0 };
  for (const r of approved) {
    if (r.speed === 'superfast') carrierBestCount[r.carrier]++;
  }
  const topCarrier = (Object.entries(carrierBestCount) as [Carrier, number][])
    .sort((a, b) => b[1] - a[1])
    .filter((e) => e[1] > 0)[0]?.[0];

  function dominantSpeed(speeds: string[]) {
    if (speeds.includes('superfast')) return 'superfast' as const;
    if (speeds.includes('fast')) return 'fast' as const;
    return 'slow' as const;
  }

  return (
    <div style={{ background: 'var(--color-canvas-soft)', minHeight: '100svh' }}>
      {/* Header */}
      <nav style={{
        background: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 var(--space-xl)',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-lg)',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-mute)', display: 'flex', padding: 4 }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>
              {from?.name} → {to?.name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-ink-mute)', marginTop: 1 }}>{line?.name}</p>
          </div>
          <button
            onClick={() => navigate('/upload', { state: { segmentId } })}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 400,
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Upload size={12} />
            投稿
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-xxl) var(--space-xl) var(--space-huge)' }}>

        {/* キャリアフィルターバナー */}
        {activeCarrier && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(83,58,253,0.06)', border: '1px solid rgba(83,58,253,0.2)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg) var(--space-xl)',
            marginBottom: 'var(--space-lg)',
          }}>
            <span style={{ fontSize: 14, color: 'var(--color-primary)', fontWeight: 400 }}>
              {CARRIER_LABELS[activeCarrier]} の通信状況を表示中
            </span>
            <button
              onClick={() => navigate(`/segment/${segmentId}`)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 13, opacity: 0.6 }}
            >フィルター解除</button>
          </div>
        )}

        {/* Rakuten recommendation banner */}
        {topCarrier === 'rakuten' && (
          <div style={{
            background: 'var(--color-brand-dark)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            marginBottom: 'var(--space-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
            boxShadow: 'var(--shadow-2)',
          }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 400, color: 'var(--color-on-primary)', marginBottom: 3 }}>
                この区間は楽天モバイルが最速
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.39px', fontFeatureSettings: '"tnum"' }}>
                ユーザー {approved.length} 件の投稿データより
              </p>
            </div>
          </div>
        )}

        {/* Carrier summary card */}
        <div style={{
          background: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-lg)',
          boxShadow: 'var(--shadow-1)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderBottom: '1px solid var(--color-hairline)' }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-ink-mute)', letterSpacing: '-0.39px' }}>
              キャリア別速度まとめ
            </p>
          </div>
          {CARRIERS.map((carrier, i) => {
            const rows = GENS.map((gen) => ({ gen, data: summary[`${carrier}-${gen}`] })).filter((r) => r.data);
            const isHighlighted = activeCarrier === carrier;
            return (
              <div
                key={carrier}
                style={{
                  padding: 'var(--space-lg) var(--space-xl)',
                  borderBottom: i < CARRIERS.length - 1 ? '1px solid var(--color-hairline)' : 'none',
                  display: 'flex', alignItems: 'center',
                  background: isHighlighted ? 'rgba(83,58,253,0.04)' : 'transparent',
                  borderLeft: isHighlighted ? '3px solid var(--color-primary)' : '3px solid transparent',
                }}
              >
                <CarrierIcon carrier={carrier} showLabel />
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {rows.length === 0 ? (
                    <span style={{ fontSize: 13, color: 'var(--color-hairline-input)', fontFeatureSettings: '"tnum"' }}>データなし</span>
                  ) : rows.map(({ gen, data }) => (
                    <div key={gen} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--color-ink-mute)', fontFeatureSettings: '"tnum"', fontWeight: 400 }}>{gen}</span>
                      <SpeedBadge speed={dominantSpeed(data.speeds)} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Position breakdown card */}
        <div style={{
          background: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-lg)',
          boxShadow: 'var(--shadow-1)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderBottom: '1px solid var(--color-hairline)' }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-ink-mute)', letterSpacing: '-0.39px' }}>
              区間内の位置別詳細
            </p>
          </div>

          {/* Timeline rail */}
          <div style={{ padding: 'var(--space-xl) var(--space-xl) var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              {POSITIONS.map((pos, i) => (
                <div key={pos.value} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {i > 0 && <div style={{ flex: 1, height: 1, background: 'var(--color-hairline)' }} />}
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: '2px solid var(--color-primary-subdued)',
                      background: 'var(--color-canvas)',
                      flexShrink: 0,
                    }} />
                    {i < POSITIONS.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--color-hairline)' }} />}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--color-ink-mute)', marginTop: 4, fontFeatureSettings: '"tnum"' }}>
                    {pos.value}%
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {POSITIONS.map((pos) => {
                const posRecords = approved.filter((r) => r.position === pos.value);
                const byCarrier = CARRIERS.map((c) => ({
                  carrier: c,
                  records: posRecords.filter((r) => r.carrier === c),
                })).filter((c) => c.records.length > 0);

                return (
                  <div key={pos.value} style={{ borderLeft: '2px solid var(--color-primary-subdued)', paddingLeft: 'var(--space-lg)' }}>
                    <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-ink-secondary)', marginBottom: 6, letterSpacing: '-0.39px' }}>
                      {pos.label}
                    </p>
                    {byCarrier.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--color-hairline-input)' }}>データなし</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {byCarrier.map(({ carrier, records: cr }) => (
                          <div key={carrier} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CarrierIcon carrier={carrier} size="sm" showLabel={false} />
                            <SpeedBadge speed={dominantSpeed(cr.map((r) => r.speed))} size="sm" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-ink-mute)', letterSpacing: '-0.39px', fontFeatureSettings: '"tnum"' }}>
          {approved.length} 件のユーザー報告に基づくデータ
        </p>
      </div>
    </div>
  );
}
