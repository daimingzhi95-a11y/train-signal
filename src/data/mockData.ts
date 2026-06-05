// This file re-exports GTFS-based data as the app's canonical data source.
// All 784 lines and 16,321 stations come from japan-train-data (MIT license).
// Note: Shinkansen data is NOT included in japan-train-data package.
import type { Line, Segment, SpeedRecord } from './types';
import { GTFS_LINES } from './gtfsData';

export const LINES: Line[] = GTFS_LINES as unknown as Line[];

// Build segments from consecutive station pairs in each line
export function buildSegments(lines: Line[]): Segment[] {
  const segments: Segment[] = [];
  for (const line of lines) {
    const sorted = [...line.stations].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length - 1; i++) {
      segments.push({
        id: `${line.id}__${sorted[i].id}__${sorted[i + 1].id}`,
        lineId: line.id,
        fromStationId: sorted[i].id,
        toStationId: sorted[i + 1].id,
      });
    }
  }
  return segments;
}

export const ALL_SEGMENTS: Segment[] = buildSegments(LINES);

// Seed speed records using verified GTFS station IDs
// JR山手線(g11302): 大崎g1130201 五反田g1130202 新宿g1130208 新大久保g1130209
// JR東海道本線東京～熱海(g11301): 東京g1130101 新橋g1130102
// 大阪環状線(g11623): 天王寺g1162301 新今宮g1162302
// 東武東上線(g21001): 池袋g2100101 北池袋g2100102
export const INITIAL_SPEED_RECORDS: SpeedRecord[] = [
  // 山手線 大崎→五反田
  { id: 'r1', segmentId: 'g11302__g1130201__g1130202', position: 0, carrier: 'rakuten', generation: '5G', speed: 'superfast', createdAt: '2026-05-10T10:00:00Z', approved: true },
  { id: 'r2', segmentId: 'g11302__g1130201__g1130202', position: 50, carrier: 'docomo', generation: '5G', speed: 'fast', createdAt: '2026-05-11T09:00:00Z', approved: true },
  // 山手線 新宿→新大久保
  { id: 'r3', segmentId: 'g11302__g1130208__g1130209', position: 25, carrier: 'rakuten', generation: '5G', speed: 'superfast', createdAt: '2026-05-12T08:00:00Z', approved: true },
  { id: 'r4', segmentId: 'g11302__g1130208__g1130209', position: 75, carrier: 'au', generation: '4G', speed: 'slow', createdAt: '2026-05-13T07:00:00Z', approved: true },
  // JR東海道本線 東京→新橋
  { id: 'r5', segmentId: 'g11301__g1130101__g1130102', position: 50, carrier: 'rakuten', generation: '5G', speed: 'superfast', createdAt: '2026-05-14T07:00:00Z', approved: true },
  { id: 'r6', segmentId: 'g11301__g1130101__g1130102', position: 75, carrier: 'softbank', generation: '5G', speed: 'fast', createdAt: '2026-05-15T07:00:00Z', approved: true },
  // 大阪環状線 天王寺→新今宮
  { id: 'r7', segmentId: 'g11623__g1162301__g1162302', position: 0, carrier: 'rakuten', generation: '4G', speed: 'fast', createdAt: '2026-05-16T09:00:00Z', approved: true },
  { id: 'r8', segmentId: 'g11623__g1162301__g1162302', position: 100, carrier: 'au', generation: '5G', speed: 'superfast', createdAt: '2026-05-17T09:00:00Z', approved: true },
  // 東武東上線 池袋→北池袋
  { id: 'r9', segmentId: 'g21001__g2100101__g2100102', position: 0, carrier: 'rakuten', generation: '5G', speed: 'fast', createdAt: '2026-05-18T08:00:00Z', approved: true },
  // Pending (承認待ち)
  { id: 'r10', segmentId: 'g11302__g1130219__g1130220', position: 50, carrier: 'rakuten', generation: '5G', speed: 'slow', createdAt: '2026-06-01T10:00:00Z', approved: false },
  { id: 'r11', segmentId: 'g21001__g2100102__g2100103', position: 25, carrier: 'docomo', generation: '4G', speed: 'fast', createdAt: '2026-06-02T09:00:00Z', approved: false },
];
