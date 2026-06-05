import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, Trash2 } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useAppStore } from '../store/appStore';
import { LINES, ALL_SEGMENTS } from '../data/mockData';
import SpeedBadge from '../components/SpeedBadge';
import CarrierIcon from '../components/CarrierIcon';
import type { Carrier } from '../data/types';

type Filter = 'pending' | 'approved' | 'all';

export default function AdminPage() {
  const navigate = useNavigate();
  const isLoggedIn = useAdminStore((s) => s.isLoggedIn);
  const logout = useAdminStore((s) => s.logout);
  const records = useAppStore((s) => s.speedRecords);
  const approveRecord = useAppStore((s) => s.approveRecord);
  const deleteRecord = useAppStore((s) => s.deleteRecord);
  const [filter, setFilter] = useState<Filter>('pending');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!isLoggedIn) {
    navigate('/admin/login');
    return null;
  }

  const segmentsById = Object.fromEntries(ALL_SEGMENTS.map((s) => [s.id, s]));
  const allStations = LINES.flatMap((l) => l.stations);
  const stationsById = Object.fromEntries(allStations.map((s) => [s.id, s]));
  const linesById = Object.fromEntries(LINES.map((l) => [l.id, l]));

  const filtered = records.filter((r) => {
    if (filter === 'pending') return !r.approved;
    if (filter === 'approved') return r.approved;
    return true;
  });
  const pendingCount = records.filter((r) => !r.approved).length;
  const approvedCount = records.length - pendingCount;

  function handleLogout() { logout(); navigate('/admin/login'); }
  function handleDelete(id: string) {
    if (confirmDelete === id) { deleteRecord(id); setConfirmDelete(null); }
    else setConfirmDelete(id);
  }

  return (
    <div style={{ background: 'var(--color-canvas-soft)', minHeight: '100svh', fontFamily: 'var(--font-family)' }}>
      {/* Header — dark shell */}
      <nav style={{
        background: 'var(--color-brand-dark)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
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
          <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-on-primary)', letterSpacing: '-0.15px', flex: 1 }}>
            でんしゃ電波 — 管理画面
          </span>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-family)',
            }}
          >
            <LogOut size={14} />
            ログアウト
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-xxl) var(--space-xl) var(--space-huge)' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', marginBottom: 'var(--space-xxl)' }}>
          <StatCard label="総投稿数" value={records.length} />
          <StatCard label="承認待ち" value={pendingCount} accent="var(--color-ruby)" />
          <StatCard label="承認済み" value={approvedCount} accent="#22c55e" />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
          {(['pending', 'approved', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'var(--color-ink)' : 'var(--color-canvas)',
                color: filter === f ? 'var(--color-on-primary)' : 'var(--color-ink-mute)',
                border: `1px solid ${filter === f ? 'var(--color-ink)' : 'var(--color-hairline)'}`,
                borderRadius: 'var(--radius-pill)',
                padding: '5px 14px',
                fontSize: 13,
                fontWeight: 400,
                fontFamily: 'var(--font-family)',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {f === 'pending' ? `承認待ち (${pendingCount})` : f === 'approved' ? '承認済み' : 'すべて'}
            </button>
          ))}
        </div>

        {/* Records table-style */}
        <div style={{
          background: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-1)',
        }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--color-ink-mute)', fontSize: 15, padding: '64px 0' }}>
              対象のデータがありません
            </p>
          )}
          {filtered.map((r, i) => {
            const seg = segmentsById[r.segmentId];
            const from = stationsById[seg?.fromStationId ?? ''];
            const to = stationsById[seg?.toStationId ?? ''];
            const line = linesById[seg?.lineId ?? ''];
            const date = new Date(r.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--space-lg) var(--space-xl)',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--color-hairline)' : 'none',
                  background: !r.approved ? 'rgba(234,34,97,0.02)' : 'transparent',
                  gap: 'var(--space-xl)',
                }}
              >
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: r.approved ? '#22c55e' : 'var(--color-ruby)',
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: 'var(--color-ink-mute)', marginBottom: 2, letterSpacing: '-0.39px', fontFeatureSettings: '"tnum"' }}>
                    {line?.name ?? '—'}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--color-ink)', letterSpacing: '-0.15px', marginBottom: 6 }}>
                    {from?.name ?? '?'} → {to?.name ?? '?'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                    <CarrierIcon carrier={r.carrier as Carrier} size="sm" showLabel />
                    <span style={{ fontSize: 11, color: 'var(--color-ink-mute)', fontFeatureSettings: '"tnum"', fontWeight: 400 }}>{r.generation}</span>
                    <SpeedBadge speed={r.speed} size="sm" />
                    <span style={{ fontSize: 11, color: 'var(--color-ink-mute)', fontFeatureSettings: '"tnum"' }}>位置 {r.position}%</span>
                    <span style={{ fontSize: 11, color: 'var(--color-hairline-input)', fontFeatureSettings: '"tnum"', letterSpacing: '-0.39px' }}>{date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexShrink: 0 }}>
                  {!r.approved && (
                    <button
                      onClick={() => approveRecord(r.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        color: '#16a34a',
                        borderRadius: 'var(--radius-pill)',
                        padding: '5px 12px',
                        fontSize: 13,
                        fontWeight: 400,
                        fontFamily: 'var(--font-family)',
                        cursor: 'pointer',
                      }}
                    >
                      <Check size={12} />
                      承認
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: confirmDelete === r.id ? 'var(--color-ruby)' : 'rgba(234,34,97,0.06)',
                      border: `1px solid ${confirmDelete === r.id ? 'var(--color-ruby)' : 'rgba(234,34,97,0.2)'}`,
                      color: confirmDelete === r.id ? 'white' : 'var(--color-ruby)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '5px 12px',
                      fontSize: 13,
                      fontWeight: 400,
                      fontFamily: 'var(--font-family)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Trash2 size={12} />
                    {confirmDelete === r.id ? '確認' : '削除'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{
      background: 'var(--color-canvas)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xl)',
      boxShadow: 'var(--shadow-1)',
    }}>
      <p style={{
        fontSize: 32,
        fontWeight: 300,
        letterSpacing: '-0.64px',
        color: accent ?? 'var(--color-ink)',
        marginBottom: 4,
        fontFeatureSettings: '"tnum"',
      }}>
        {value}
      </p>
      <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', letterSpacing: '-0.39px', fontFeatureSettings: '"tnum"' }}>
        {label}
      </p>
    </div>
  );
}
