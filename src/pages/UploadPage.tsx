import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Loader } from 'lucide-react';
import { LINES, ALL_SEGMENTS } from '../data/mockData';
import { useAppStore } from '../store/appStore';
import type { Carrier, NetworkGeneration, SpeedLevel, SegmentPosition } from '../data/types';
import { CARRIER_LABELS, SPEED_LABELS, SPEED_COLORS } from '../data/types';

type Step = 'line' | 'from' | 'segment' | 'position' | 'carrier' | 'speed' | 'done';

const CARRIERS: Carrier[] = ['rakuten', 'docomo', 'au', 'softbank'];
const GENS: NetworkGeneration[] = ['5G', '4G'];
const SPEEDS: SpeedLevel[] = ['slow', 'fast', 'superfast'];
const SPEED_DESC: Record<SpeedLevel, string> = {
  slow: 'ページ読込に数秒かかる',
  fast: 'ストリーミングが快適',
  superfast: '動画4Kも余裕、体感最速',
};
const POSITIONS: { value: SegmentPosition; label: string; desc: string }[] = [
  { value: 0, label: '起点（出発駅付近）', desc: '0%' },
  { value: 25, label: '前段', desc: '25%' },
  { value: 50, label: '中間', desc: '50%' },
  { value: 75, label: '後段', desc: '75%' },
  { value: 100, label: '終点（到着駅付近）', desc: '100%' },
];

const STEP_ORDER: Step[] = ['line', 'from', 'segment', 'position', 'carrier', 'speed', 'done'];
function prevStep(step: Step): Step {
  const idx = STEP_ORDER.indexOf(step);
  return idx > 0 ? STEP_ORDER[idx - 1] : 'line';
}

export default function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addRecord = useAppStore((s) => s.addSpeedRecord);

  const initLineId = (location.state as any)?.lineId ?? '';
  const initSegmentId = (location.state as any)?.segmentId ?? '';

  const [step, setStep] = useState<Step>(initSegmentId ? 'position' : initLineId ? 'from' : 'line');
  const [locating, setLocating] = useState(false);
  const [lineId, setLineId] = useState(initLineId);
  const [fromStationId, setFromStationId] = useState('');
  const [segmentId, setSegmentId] = useState(initSegmentId);
  const [position, setPosition] = useState<SegmentPosition>(50);
  const [carrier, setCarrier] = useState<Carrier>('rakuten');
  const [generation, setGeneration] = useState<NetworkGeneration>('5G');
  const [speed, setSpeed] = useState<SpeedLevel>('fast');

  function detectLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => setLocating(false),
      () => setLocating(false),
      { timeout: 5000 }
    );
  }

  const line = LINES.find((l) => l.id === lineId);
  const sortedStations = line ? [...line.stations].sort((a, b) => a.order - b.order) : [];
  const fromStation = line?.stations.find((s) => s.id === fromStationId);
  const candidateSegments = fromStationId
    ? ALL_SEGMENTS.filter((s) => s.lineId === lineId && (s.fromStationId === fromStationId || s.toStationId === fromStationId))
    : [];

  function selectLine(id: string) { setLineId(id); setFromStationId(''); setSegmentId(''); setStep('from'); }
  function selectFrom(stId: string) { setFromStationId(stId); setStep('segment'); }
  function selectSegment(segId: string) { setSegmentId(segId); setStep('position'); }
  function selectPosition(p: SegmentPosition) { setPosition(p); setStep('carrier'); }
  function submit() { if (!segmentId) return; addRecord({ segmentId, position, carrier, generation, speed }); setStep('done'); }

  const STEP_TITLE: Record<Step, string> = {
    line: '路線を選択', from: '乗車駅を選択', segment: '区間を選択',
    position: '車内の位置', carrier: 'キャリア・通信世代', speed: '通信速度', done: '投稿完了',
  };

  const progress = ((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100;

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
          maxWidth: 640,
          margin: '0 auto',
          padding: '0 var(--space-xl)',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-lg)',
        }}>
          <button
            onClick={() => step === 'line' ? navigate(-1) : setStep(prevStep(step))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-mute)', display: 'flex', padding: 4 }}
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px', flex: 1 }}>
            {STEP_TITLE[step]}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 2, background: 'var(--color-hairline)' }}>
          <div style={{
            height: '100%',
            background: 'var(--color-primary)',
            width: `${progress}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-xl) var(--space-xl) var(--space-huge)' }}>

        {/* STEP: line */}
        {step === 'line' && (
          <div>
            <button
              onClick={detectLocation}
              disabled={locating}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-lg)',
                background: 'var(--color-canvas)',
                border: '1px solid var(--color-primary-subdued)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg) var(--space-xl)',
                color: 'var(--color-primary)',
                fontSize: 15,
                fontWeight: 400,
                fontFamily: 'var(--font-family)',
                cursor: 'pointer',
                marginBottom: 'var(--space-lg)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              {locating ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={16} />}
              {locating ? '現在地を取得中…' : '現在地から路線を絞り込む'}
            </button>

            <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', textAlign: 'center', marginBottom: 'var(--space-lg)' }}>または路線を選択</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {LINES.map((l) => (
                <button key={l.id} onClick={() => selectLine(l.id)} style={listItemStyle}>
                  <span style={{ width: 4, height: 36, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>{l.name}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', letterSpacing: '-0.39px', fontFeatureSettings: '"tnum"' }}>{l.region}</p>
                  </div>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: from */}
        {step === 'from' && line && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-lg)' }}>
              <span style={{ color: 'var(--color-ink)', fontWeight: 400 }}>{line.name}</span> の乗車駅
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {sortedStations.map((st) => (
                <button key={st.id} onClick={() => selectFrom(st.id)} style={listItemStyle}>
                  <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', flex: 1, textAlign: 'left', letterSpacing: '-0.15px' }}>{st.name}</span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: segment */}
        {step === 'segment' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-lg)' }}>
              <span style={{ color: 'var(--color-ink)', fontWeight: 400 }}>{fromStation?.name}</span> からの区間
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {candidateSegments.map((seg) => {
                const other = seg.fromStationId === fromStationId ? seg.toStationId : seg.fromStationId;
                const otherSt = line?.stations.find((s) => s.id === other);
                const dir = seg.fromStationId === fromStationId ? '→' : '←';
                return (
                  <button key={seg.id} onClick={() => selectSegment(seg.id)} style={listItemStyle}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>
                        {fromStation?.name} <span style={{ color: 'var(--color-ink-mute)', fontSize: 12 }}>{dir}</span> {otherSt?.name}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', marginTop: 2 }}>{line?.name}</p>
                    </div>
                    <ChevronRight />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP: position */}
        {step === 'position' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-xl)' }}>電車内のどのあたりで計測しましたか？</p>
            {/* Timeline */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              {POSITIONS.map((pos, i) => (
                <div key={pos.value} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {i > 0 && <div style={{ flex: 1, height: 1, background: 'var(--color-hairline)' }} />}
                    <button
                      onClick={() => setPosition(pos.value)}
                      style={{
                        width: 14, height: 14,
                        borderRadius: '50%',
                        border: `2px solid ${position === pos.value ? 'var(--color-primary)' : 'var(--color-hairline-input)'}`,
                        background: position === pos.value ? 'var(--color-primary)' : 'var(--color-canvas)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                        padding: 0,
                      }}
                    />
                    {i < POSITIONS.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--color-hairline)' }} />}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--color-ink-mute)', marginTop: 4, fontFeatureSettings: '"tnum"' }}>{pos.desc}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => selectPosition(pos.value)}
                  style={{
                    ...listItemStyle,
                    border: `1px solid ${position === pos.value ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                    background: position === pos.value ? 'rgba(83,58,253,0.04)' : 'var(--color-canvas)',
                  }}
                >
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>{pos.label}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', fontFeatureSettings: '"tnum"' }}>{pos.desc}</p>
                  </div>
                  {position === pos.value && <CheckCircle size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: carrier */}
        {step === 'carrier' && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-lg)' }}>キャリアを選択</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
              {CARRIERS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCarrier(c)}
                  style={{
                    ...listItemStyle,
                    border: `1px solid ${carrier === c ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                    background: carrier === c ? 'rgba(83,58,253,0.04)' : 'var(--color-canvas)',
                  }}
                >
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>
                    {CARRIER_LABELS[c]}
                  </span>
                  {carrier === c && <CheckCircle size={16} style={{ color: 'var(--color-primary)' }} />}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-md)' }}>通信世代</p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              {GENS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGeneration(g)}
                  style={{
                    flex: 1,
                    padding: 'var(--space-lg)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${generation === g ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                    background: generation === g ? 'rgba(83,58,253,0.04)' : 'var(--color-canvas)',
                    color: generation === g ? 'var(--color-primary)' : 'var(--color-ink-mute)',
                    fontSize: 18,
                    fontWeight: generation === g ? 400 : 300,
                    fontFamily: 'var(--font-family)',
                    cursor: 'pointer',
                    letterSpacing: '-0.26px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>

            <button onClick={() => setStep('speed')} style={primaryBtnStyle}>次へ</button>
          </div>
        )}

        {/* STEP: speed */}
        {step === 'speed' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-xl)' }}>
              <span style={{ color: 'var(--color-ink)', fontWeight: 400 }}>{CARRIER_LABELS[carrier]} {generation}</span> の速度
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    ...listItemStyle,
                    padding: 'var(--space-xl)',
                    border: `1px solid ${speed === s ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                    background: speed === s ? 'rgba(83,58,253,0.04)' : 'var(--color-canvas)',
                  }}
                >
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 18, fontWeight: 300, letterSpacing: '-0.26px', color: SPEED_COLORS[s], marginBottom: 4 }}>
                      {SPEED_LABELS[s]}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', letterSpacing: '-0.39px' }}>{SPEED_DESC[s]}</p>
                  </div>
                  {speed === s && <CheckCircle size={16} style={{ color: 'var(--color-primary)' }} />}
                </button>
              ))}
            </div>
            <button onClick={submit} style={primaryBtnStyle}>投稿する</button>
          </div>
        )}

        {/* STEP: done */}
        {step === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 'var(--space-xl)' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle size={32} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.22px', color: 'var(--color-ink)', marginBottom: 8 }}>
                投稿ありがとうございます
              </p>
              <p style={{ fontSize: 15, color: 'var(--color-ink-mute)' }}>管理者確認後に反映されます</p>
            </div>
            {segmentId && (
              <button onClick={() => navigate(`/segment/${segmentId}`)} style={primaryBtnStyle}>
                この区間の通信状況を見る
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              style={{ fontSize: 13, color: 'var(--color-ink-mute)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const listItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-lg)',
  background: 'var(--color-canvas)',
  border: '1px solid var(--color-hairline)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-lg) var(--space-xl)',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-1)',
  fontFamily: 'var(--font-family)',
  transition: 'box-shadow 0.15s ease',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-primary)',
  color: 'var(--color-on-primary)',
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  padding: '10px 24px',
  fontSize: 16,
  fontWeight: 400,
  fontFamily: 'var(--font-family)',
  cursor: 'pointer',
  letterSpacing: 0,
};

function ChevronRight() {
  return <span style={{ color: 'var(--color-hairline-input)', fontSize: 16, flexShrink: 0 }}>›</span>;
}
