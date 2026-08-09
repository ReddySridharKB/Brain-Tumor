import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Patient {
  id: number;
  patient_uid: string;
  name: string;
  age: number;
  sex: string;
  dob: string;
  blood_group: string;
  created_at: string;
}

export interface PatientWithScans extends Patient {
  scans: any[]; // Will be typed properly in useScanStore
}

interface PatientState {
  patients: Patient[];
  deletedPatients: Patient[];
  currentPatient: PatientWithScans | null;
  isLoading: boolean;
  error: string | null;
  fetchPatients: () => Promise<void>;
  fetchDeletedPatients: () => Promise<void>;
  fetchPatientById: (id: number) => Promise<void>;
  createPatient: (data: Omit<Patient, 'id' | 'patient_uid' | 'created_at'>) => Promise<Patient>;
  updatePatient: (id: number, data: Omit<Patient, 'id' | 'patient_uid' | 'created_at'>) => Promise<Patient>;
  deletePatient: (id: number) => Promise<void>;
  restorePatient: (id: number) => Promise<void>;
  permanentlyDeletePatient: (id: number) => Promise<void>;
}

export const usePatientStore = create<PatientState>((set) => ({
  patients: [],
  deletedPatients: [],
  currentPatient: null,
  isLoading: false,
  error: null,

  fetchPatients: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/patients', { silent: true } as any);
      set({ patients: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchDeletedPatients: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/patients/deleted');
      set({ deletedPatients: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPatientById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/patients/${id}`);
      set({ currentPatient: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createPatient: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/patients/create', data);
      set((state) => ({ 
        patients: [...state.patients, response.data],
        isLoading: false 
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updatePatient: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/patients/${id}`, data);
      set((state) => ({ 
        patients: state.patients.map(p => p.id === id ? response.data : p),
        isLoading: false 
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deletePatient: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/patients/${id}`);
      set((state) => ({ 
        patients: state.patients.filter(p => p.id !== id),
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  restorePatient: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/patients/${id}/restore`);
      set((state) => ({ 
        deletedPatients: state.deletedPatients.filter(p => p.id !== id),
        patients: [...state.patients, response.data],
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  permanentlyDeletePatient: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/patients/${id}/permanent`);
      set((state) => ({ 
        deletedPatients: state.deletedPatients.filter(p => p.id !== id),
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
