import { create } from 'zustand';
import { api } from '@/lib/api';

export interface MRIScan {
  id: number;
  scan_uid: string;
  patient_id: number;
  original_image_path: string;
  highlighted_image_path: string | null;
  heatmap_path: string | null;
  uploaded_at: string;
  tumor_type: string | null;
  tumor_risk: string | null;
  probability: number | null;
  tumor_location: string | null;
  ai_summary: string | null;
  severity: string | null;
  comparison_result: string | null;
  growth_percentage: number | null;
}

interface ScanState {
  scans: MRIScan[];
  currentScan: MRIScan | null;
  isUploading: boolean;
  uploadStatus: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
  error: string | null;
  uploadScan: (patientId: number, file: File) => Promise<MRIScan>;
  fetchScanHistory: (patientId: number) => Promise<void>;
  fetchScanById: (scanId: number) => Promise<void>;
  setCurrentScan: (scan: MRIScan) => void;
  resetUploadState: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  scans: [],
  currentScan: null,
  isUploading: false,
  uploadStatus: 'idle',
  error: null,

  uploadScan: async (patientId: number, file: File) => {
    set({ isUploading: true, uploadStatus: 'uploading', error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate "analyzing" state shortly after upload starts (optimistic UI)
      setTimeout(() => set({ uploadStatus: 'analyzing' }), 1000);

      const response = await api.post(`/scans/upload/${patientId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      set((state) => ({ 
        scans: [...state.scans, response.data],
        currentScan: response.data,
        isUploading: false,
        uploadStatus: 'complete'
      }));
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        isUploading: false,
        uploadStatus: 'error'
      });
      throw error;
    }
  },

  fetchScanHistory: async (patientId: number) => {
    try {
      const response = await api.get(`/scans/history/${patientId}`);
      set({ scans: response.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchScanById: async (scanId: number) => {
    try {
      const response = await api.get(`/scans/${scanId}`);
      set({ currentScan: response.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCurrentScan: (scan: MRIScan) => {
    set({ currentScan: scan });
  },

  resetUploadState: () => {
    set({ isUploading: false, uploadStatus: 'idle', error: null });
  }
}));
