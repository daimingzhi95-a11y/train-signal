import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SpeedRecord, Carrier, NetworkGeneration, SpeedLevel, SegmentPosition } from '../data/types';
import { INITIAL_SPEED_RECORDS } from '../data/mockData';

interface AppStore {
  speedRecords: SpeedRecord[];
  addSpeedRecord: (record: Omit<SpeedRecord, 'id' | 'createdAt' | 'approved'>) => void;
  approveRecord: (id: string) => void;
  deleteRecord: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      speedRecords: INITIAL_SPEED_RECORDS,
      addSpeedRecord: (record) =>
        set((state) => ({
          speedRecords: [
            ...state.speedRecords,
            {
              ...record,
              id: `user-${Date.now()}`,
              createdAt: new Date().toISOString(),
              approved: false,
            },
          ],
        })),
      approveRecord: (id) =>
        set((state) => ({
          speedRecords: state.speedRecords.map((r) =>
            r.id === id ? { ...r, approved: true } : r
          ),
        })),
      deleteRecord: (id) =>
        set((state) => ({
          speedRecords: state.speedRecords.filter((r) => r.id !== id),
        })),
    }),
    { name: 'train-signal-records' }
  )
);

export type { Carrier, NetworkGeneration, SpeedLevel, SegmentPosition };
