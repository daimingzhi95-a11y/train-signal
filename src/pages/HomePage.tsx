import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, Check, X, ChevronRight, MapPin } from 'lucide-react';
import { LINES } from '../data/mockData';
import type { Carrier } from '../data/types';

const POPULAR_IDS = [
  'g11302','g25001','g11312','g26003','g11301','g28004','g24001','g11332',
  'g11313','g26001','g99618','g11319','g11323','g21002','g22001','g28005',
  'g11320','g34001','g11602','g28002',
];

const CARRIERS: Carrier[] = ['rakuten', 'docomo', 'au', 'softbank'];
const CARRIER_LABEL: Record<Carrier, string> = {
  rakuten: '楽天モバイル', docomo: 'Docomo', au: 'au', softbank: 'SoftBank',
};
const CARRIER_COLOR: Record<Carrier, string> = {
  rakuten: '#FF008C', docomo: '#e60012', au: '#e55c00', softbank: '#333344',
};

const REGIONS = [...new Set(LINES.map((l) => l.region))].sort();

export default function HomePage() {
  const navigate = useNavigate();
  const [carrier, setCarrier] = useState<Carrier | ''>('');
  const [search, setSearch] = useState('');
  const [regionPanelOpen, setRegionPanelOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [panelSearch, setPanelSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const panelSearchRef = useRef<HTMLInputElement>(null);

  const popularLines = POPULAR_IDS
    .map((id) => LINES.find((l) => l.id === id))
    .filter(Boolean) as typeof LINES;

  const q = search.trim().toLowerCase();
  const searchResults = q
    ? LINES.filter((l) => l.name.toLowerCase().includes(q) || l.nameKana.toLowerCase().includes(q)).slice(0, 20)
    : null;

  const go = useCallback((id: string) => {
    navigate(`/line/${id}${carrier ? `?carrier=${carrier}` : ''}`);
    setRegionPanelOpen(false);
    setPanelSearch('');
  }, [navigate, carrier]);

  // 背景クリックで閉じる
  useEffect(() => {
    if (!regionPanelOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setRegionPanelOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [regionPanelOpen]);

  // パネル内のリスト
  const panelLines = selectedRegion
    ? LINES.filter((l) => l.region === selectedRegion)
    : [];

  return (
    <div style={{ background: 'var(--color-canvas)', minHeight: '100svh' }}>

      {/* Nav */}
      <nav style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--space-xl)', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 300, fontSize: 20, letterSpacing: '-0.2px', color: 'var(--color-ink)' }}>
            でんしゃ<span style={{ color: 'var(--color-primary)' }}>電波</span>
          </span>
          <button onClick={() => navigate('/upload')} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', padding: '8px 16px', fontSize: 14, fontWeight: 400, fontFamily: 'var(--font-family)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={13} />情報を投稿
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 10% 40%, #f5e9d4 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 30% 20%, #f0c6a0 0%, transparent 55%), radial-gradient(ellipse 70% 70% at 55% 30%, #d4c8f8 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 75% 20%, #533afd22 0%, transparent 55%), #f6f9fc`, opacity: 0.9 }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', padding: '48px var(--space-xl) 52px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', marginBottom: 14 }}>
            <span style={{ background: 'var(--color-primary-subdued)', color: 'var(--color-primary-deep)', borderRadius: 'var(--radius-pill)', padding: '4px 10px', fontSize: 10, fontWeight: 400, letterSpacing: '0.1px', textTransform: 'uppercase' }}>後悔しないキャリア選びを</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 46px)', fontWeight: 300, lineHeight: 1.07, letterSpacing: '-1.1px', color: 'var(--color-ink)', margin: '0 auto 16px' }}>
            路線・区間ごとの<br />4G / 5G通信速度を確認
          </h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--color-ink-mute)', margin: '0 auto', maxWidth: 380, lineHeight: 1.6 }}>
            掲載データはすべて本サービスのユーザーが投稿した実測情報に基づいています。
          </p>
        </div>
      </div>

      {/* キャリア選択 */}
      <div style={{ background: 'var(--color-canvas-soft)', borderBottom: '1px solid var(--color-hairline)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-lg) var(--space-xl)' }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-sm)' }}>確認したいキャリアを選択（任意）</p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            {CARRIERS.map((c) => {
              const active = carrier === c;
              return (
                <button key={c} onClick={() => setCarrier(active ? '' : c)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 'var(--radius-pill)', border: active ? `1.5px solid ${CARRIER_COLOR[c]}` : '1px solid var(--color-hairline)', background: active ? `${CARRIER_COLOR[c]}14` : 'var(--color-canvas)', color: active ? CARRIER_COLOR[c] : 'var(--color-ink-secondary)', fontSize: 13, fontWeight: active ? 400 : 300, fontFamily: 'var(--font-family)', cursor: 'pointer', transition: 'all 0.12s', boxShadow: active ? `0 0 0 3px ${CARRIER_COLOR[c]}18` : 'none' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: CARRIER_COLOR[c], flexShrink: 0 }} />
                  {CARRIER_LABEL[c]}
                  {active && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* メイン */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-xl) var(--space-xl) var(--space-huge)' }}>

        {/* 検索 */}
        <div style={{ position: 'relative', maxWidth: 480, marginBottom: 'var(--space-xxl)' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(100,116,141,0.35)', pointerEvents: 'none' }} />
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="路線名を検索…"
            style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 30 : 14, paddingTop: 9, paddingBottom: 9, borderRadius: 'var(--radius-sm)', color: 'var(--color-ink)', fontSize: 14, fontWeight: 300, fontFamily: 'var(--font-family)', outline: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-mute)', fontSize: 14, lineHeight: 1, padding: 2 }}>✕</button>
          )}
        </div>

        {/* 検索結果 */}
        {searchResults !== null && (
          <div style={{ marginBottom: 'var(--space-xxl)' }}>
            <p style={{ fontSize: 12, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-md)' }}>
              検索結果 {searchResults.length === 0 ? '— なし' : `${searchResults.length}件`}
            </p>
            {searchResults.length > 0 && <LineGrid lines={searchResults} onSelect={go} />}
          </div>
        )}

        {/* 人気路線（検索中は非表示） */}
        {searchResults === null && (
          <section>
            <p style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-ink-mute)', letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: 'var(--space-lg)' }}>人気路線</p>
            <LineGrid lines={popularLines} onSelect={go} />
          </section>
        )}
      </div>

      {/* ── 左中央 固定フローティングボタン ── */}
      <button
        onClick={() => { setRegionPanelOpen(true); setSelectedRegion(null); setPanelSearch(''); }}
        style={{
          position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 35, writingMode: 'vertical-rl', textOrientation: 'mixed',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '14px 10px',
          background: 'var(--color-ink)', color: '#fff',
          border: 'none', borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: 13, fontWeight: 300, fontFamily: 'var(--font-family)',
          letterSpacing: '0.5px', cursor: 'pointer',
          boxShadow: 'var(--shadow-2)', transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ink)'; }}
      >
        <MapPin size={14} style={{ flexShrink: 0 }} />
        全路線
      </button>

      {/* ── パネル ── */}
      {regionPanelOpen && (
        <>
          <div onClick={() => { setRegionPanelOpen(false); setPanelSearch(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(13,37,61,0.4)', zIndex: 40, backdropFilter: 'blur(2px)' }} />

          <div ref={panelRef} className="panel-slide-left" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, width: '100%', maxWidth: 420, background: 'var(--color-canvas)', boxShadow: '8px 0 40px rgba(13,37,61,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>

            {/* ヘッダー */}
            <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedRegion && !panelSearch && (
                  <button onClick={() => setSelectedRegion(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-mute)', fontSize: 20, lineHeight: 1, padding: '0 4px 0 0' }}>‹</button>
                )}
                <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>
                  {panelSearch ? `検索結果` : selectedRegion ?? '全路線'}
                </span>
                {(selectedRegion && !panelSearch) && (
                  <span style={{ fontSize: 12, color: 'var(--color-ink-mute)', fontFeatureSettings: '"tnum"' }}>{panelLines.length}路線</span>
                )}
              </div>
              <button onClick={() => { setRegionPanelOpen(false); setPanelSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-mute)', display: 'flex', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* 検索バー */}
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-hairline)', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(100,116,141,0.4)', pointerEvents: 'none' }} />
                <input
                  ref={panelSearchRef}
                  value={panelSearch}
                  onChange={(e) => { setPanelSearch(e.target.value); setSelectedRegion(null); }}
                  placeholder="路線名を検索…"
                  style={{ width: '100%', paddingLeft: 30, paddingRight: panelSearch ? 28 : 10, paddingTop: 8, paddingBottom: 8, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline)', background: 'var(--color-canvas-soft)', color: 'var(--color-ink)', fontSize: 13, fontWeight: 300, fontFamily: 'var(--font-family)', outline: 'none' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-canvas)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-hairline)'; e.currentTarget.style.background = 'var(--color-canvas-soft)'; }}
                />
                {panelSearch && (
                  <button onClick={() => setPanelSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-mute)', fontSize: 13, lineHeight: 1, padding: 0 }}>✕</button>
                )}
              </div>
            </div>

            {/* コンテンツ */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md) var(--space-lg)' }}>

              {/* 検索結果 */}
              {panelSearch && (() => {
                const pq = panelSearch.trim().toLowerCase();
                const results = LINES.filter((l) => l.name.toLowerCase().includes(pq) || l.nameKana.toLowerCase().includes(pq));
                return results.length === 0
                  ? <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', padding: '24px 0' }}>なし</p>
                  : <PanelLineList lines={results} onSelect={go} />;
              })()}

              {/* 地域一覧（検索なし・地域未選択） */}
              {!panelSearch && !selectedRegion && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  {REGIONS.map((r) => {
                    const count = LINES.filter((l) => l.region === r).length;
                    return (
                      <button key={r} onClick={() => setSelectedRegion(r)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-md) var(--space-lg)', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-family)', boxShadow: 'var(--shadow-1)', transition: 'box-shadow 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-1)'; }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px' }}>{r}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-ink-mute)', fontFeatureSettings: '"tnum"' }}>{count}路線</span>
                          <ChevronRight size={13} style={{ color: 'var(--color-hairline-input)' }} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 地域内路線一覧（検索なし・地域選択済） */}
              {!panelSearch && selectedRegion && (
                <PanelLineList lines={panelLines} onSelect={go} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── PanelLineList ─────────────────────────────────────────────────

function PanelLineList({ lines, onSelect }: { lines: typeof LINES; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
      {lines.map((line) => (
        <button
          key={line.id}
          onClick={() => onSelect(line.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--space-md) var(--space-lg)', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-family)', textAlign: 'left', boxShadow: 'var(--shadow-1)', transition: 'box-shadow 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-1)'; }}
        >
          <span style={{ width: 3, height: 26, borderRadius: 2, background: line.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px', margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line.name}</p>
            <p style={{ fontSize: 11, color: 'var(--color-ink-mute)', margin: 0, fontFeatureSettings: '"tnum"' }}>{line.region} · {line.stations.length}駅</p>
          </div>
          <ChevronRight size={12} style={{ color: 'var(--color-hairline-input)', flexShrink: 0 }} />
        </button>
      ))}
    </div>
  );
}

// ── LineGrid ──────────────────────────────────────────────────────

function LineGrid({ lines, onSelect }: { lines: typeof LINES; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
      {lines.map((line) => (
        <button
          key={line.id}
          onClick={() => onSelect(line.id)}
          style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg) var(--space-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', textAlign: 'left', cursor: 'pointer', width: '100%', boxShadow: 'var(--shadow-1)', transition: 'box-shadow 0.15s, transform 0.1s' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span style={{ width: 4, height: 32, borderRadius: 2, background: line.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line.name}</p>
            <p style={{ fontSize: 11, color: 'var(--color-ink-mute)', margin: 0, fontFeatureSettings: '"tnum"', letterSpacing: '-0.39px' }}>{line.region} · {line.stations.length}駅</p>
          </div>
          <span style={{ color: 'var(--color-hairline-input)', fontSize: 15, flexShrink: 0 }}>›</span>
        </button>
      ))}
    </div>
  );
}
