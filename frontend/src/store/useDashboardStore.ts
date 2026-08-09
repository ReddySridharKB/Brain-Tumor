import { create } from 'zustand';
import { api } from '@/lib/api';

export interface DashboardMetrics {
  totalScans: number;
  activePatients: number;
  aiDetections: number;
  criticalCases: number;
  chartData: Array<{ name: string; scans: number; positive: number }>;
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  fetchMetrics: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  isLoading: false,
  error: null,
  fetchMetrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics/dashboard', { silent: true } as any);
      set({ metrics: response.data, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch dashboard metrics:", error);
      set({ error: error.message || "Failed to fetch metrics", isLoading: false });
    }
  },
}));
