export type NetworkGeneration = '4G' | '5G';
export type Carrier = 'rakuten' | 'docomo' | 'au' | 'softbank';
export type SpeedLevel = 'slow' | 'fast' | 'superfast';
// Position along a segment: 0=start, 25=front, 50=mid, 75=rear, 100=end
export type SegmentPosition = 0 | 25 | 50 | 75 | 100;

export interface Station {
  id: string;
  name: string;
  nameKana: string;
  lineId: string;
  order: number; // order along the line
}

export interface Line {
  id: string;
  name: string;
  nameKana: string;
  color: string;
  region: string;
  stations: Station[];
}

export interface Segment {
  id: string;
  lineId: string;
  fromStationId: string;
  toStationId: string;
}

export interface SpeedRecord {
  id: string;
  segmentId: string;
  position: SegmentPosition;
  carrier: Carrier;
  generation: NetworkGeneration;
  speed: SpeedLevel;
  createdAt: string;
  approved: boolean;
}

export const CARRIER_LABELS: Record<Carrier, string> = {
  rakuten: '楽天モバイル',
  docomo: 'NTTドコモ',
  au: 'au',
  softbank: 'SoftBank',
};

export const SPEED_LABELS: Record<SpeedLevel, string> = {
  slow: '遅い',
  fast: '速い',
  superfast: '超速い',
};

export const SPEED_COLORS: Record<SpeedLevel, string> = {
  slow: '#ef4444',
  fast: '#f59e0b',
  superfast: '#22c55e',
};

export const CARRIER_COLORS: Record<Carrier, string> = {
  rakuten: '#bf0000',
  docomo: '#e60012',
  au: '#ff6600',
  softbank: '#ffffff',
};
