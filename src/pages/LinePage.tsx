import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { LINES, ALL_SEGMENTS } from '../data/mockData';
import { useAppStore } from '../store/appStore';
import SpeedBadge from '../components/SpeedBadge';
import type { SpeedLevel, Carrier } from '../data/types';
import { CARRIER_LABELS } from '../data/types';

function bestSpeed(speeds: SpeedLevel[]): SpeedLevel | null {
  if (speeds.includes('superfast')) return 'superfast';
  if (speeds.includes('fast')) return 'fast';
  if (speeds.includes('slow')) return 'slow';
  return null;
}

export default function LinePage() {
  const { lineId } = useParams<{ lineId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const line = LINES.find((l) => l.id === lineId);
  const records = useAppStore((s) => s.speedRecords);
  const activeCarrier = (searchParams.get('carrier') ?? '') as Carrier | '';

  if (!line) return <div style={{ padding: 32, color: 'var(--color-ink-mute)' }}>路線が見つかりません</div>;

  const segments = ALL_SEGMENTS.filter((s) => s.lineId === lineId);
  const stationsById = Object.fromEntries(line.stations.map((s) => [s.id, s]));

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: line.color, flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>
              {line.name}
            </span>
          </div>
          <button
            onClick={() => navigate('/upload', { state: { lineId } })}
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

      {/* Body */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-xxl) var(--space-xl) var(--space-huge)' }}>
        {/* キャリアフィルター表示中バナー */}
        {activeCarrier && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(83,58,253,0.06)', border: '1px solid rgba(83,58,253,0.2)',
            borderRadius: 'var(--radius-pill)', padding: '5px 14px',
            marginBottom: 'var(--space-lg)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 400 }}>
              {CARRIER_LABELS[activeCarrier]} の通信状況
            </span>
            <button
              onClick={() => navigate(`/line/${lineId}`)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 13, opacity: 0.6, padding: 0 }}
            >✕</button>
          </div>
        )}
        <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-lg)', letterSpacing: '-0.39px', fontFeatureSettings: '"tnum"' }}>
          {segments.length} 区間 · タップして詳細を確認
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {segments.map((seg) => {
            const segRecords = records.filter((r) => r.segmentId === seg.id && r.approved);
            const speeds5g = segRecords.filter((r) => r.generation === '5G').map((r) => r.speed as SpeedLevel);
            const speeds4g = segRecords.filter((r) => r.generation === '4G').map((r) => r.speed as SpeedLevel);
            const best5g = bestSpeed(speeds5g);
            const best4g = bestSpeed(speeds4g);
            const from = stationsById[seg.fromStationId];
            const to = stationsById[seg.toStationId];

            const carrierCounts: Record<string, number> = {};
            segRecords.filter((r) => r.speed === 'superfast').forEach((r) => {
              carrierCounts[r.carrier] = (carrierCounts[r.carrier] || 0) + 1;
            });
            const topCarrier = Object.entries(carrierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Carrier | undefined;

            // キャリアフィルター時: そのキャリアの速度のみ表示
            const carrierRecords = activeCarrier ? segRecords.filter((r) => r.carrier === activeCarrier) : [];
            const carrierSpeeds5g = carrierRecords.filter((r) => r.generation === '5G').map((r) => r.speed as SpeedLevel);
            const carrierSpeeds4g = carrierRecords.filter((r) => r.generation === '4G').map((r) => r.speed as SpeedLevel);
            const carrierBest5g = bestSpeed(carrierSpeeds5g);
            const carrierBest4g = bestSpeed(carrierSpeeds4g);
            const isCarrierBest = activeCarrier && topCarrier === activeCarrier;

            return (
              <button
                key={seg.id}
                onClick={() => navigate(`/segment/${seg.id}${activeCarrier ? `?carrier=${activeCarrier}` : ''}`)}
                style={{
                  background: 'var(--color-canvas)',
                  border: isCarrierBest ? '1.5px solid var(--color-primary)' : '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-lg)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-1)',
                  transition: 'box-shadow 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-1)'; }}
              >
                {/* Station pair */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>
                      {from?.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-hairline-input)' }}>→</span>
                    <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>
                      {to?.name}
                    </span>
                  </div>
                  {topCarrier ? (
                    <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', letterSpacing: '-0.39px', fontFeatureSettings: '"tnum"' }}>
                      最速: <span style={{ color: 'var(--color-primary)', fontWeight: 400 }}>{CARRIER_LABELS[topCarrier]}</span>
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--color-hairline-input)' }}>データなし</p>
                  )}
                </div>

                {/* Speed badges — キャリアフィルター時はそのキャリアのみ */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {activeCarrier ? (
                    <>
                      {carrierBest5g && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-ink-mute)', fontWeight: 400, fontFeatureSettings: '"tnum"' }}>5G</span>
                          <SpeedBadge speed={carrierBest5g} size="sm" />
                        </div>
                      )}
                      {carrierBest4g && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-ink-mute)', fontWeight: 400, fontFeatureSettings: '"tnum"' }}>4G</span>
                          <SpeedBadge speed={carrierBest4g} size="sm" />
                        </div>
                      )}
                      {!carrierBest5g && !carrierBest4g && (
                        <span style={{ fontSize: 12, color: 'var(--color-hairline-input)' }}>データなし</span>
                      )}
                    </>
                  ) : (
                    <>
                      {best5g && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-ink-mute)', fontWeight: 400, fontFeatureSettings: '"tnum"' }}>5G</span>
                          <SpeedBadge speed={best5g} size="sm" />
                        </div>
                      )}
                      {best4g && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-ink-mute)', fontWeight: 400, fontFeatureSettings: '"tnum"' }}>4G</span>
                          <SpeedBadge speed={best4g} size="sm" />
                        </div>
                      )}
                      {!best5g && !best4g && (
                        <span style={{ fontSize: 13, color: 'var(--color-hairline)' }}>—</span>
                      )}
                    </>
                  )}
                </div>

                <span style={{ color: 'var(--color-hairline-input)', fontSize: 18, flexShrink: 0 }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
