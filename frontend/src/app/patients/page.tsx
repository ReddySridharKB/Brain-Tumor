"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Search, Filter, MoreHorizontal, FileText, Activity, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePatientStore } from "@/store/usePatientStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const { patients, fetchPatients, createPatient, updatePatient, deletePatient, isLoading } = usePatientStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "",
    dob: "",
    blood_group: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const formatPatientId = (patient: any) => {
    const year = new Date(patient.created_at).getFullYear().toString().slice(-2);
    return `BT-${year}-${String(patient.id).padStart(3, '0')}`;
  };

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    formatPatientId(patient).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsCreating(true);
    try {
      if (editPatientId) {
        await updatePatient(editPatientId, {
          name: formData.name,
          age: parseInt(formData.age),
          sex: formData.sex,
          dob: formData.dob,
          blood_group: formData.blood_group,
        });
      } else {
        await createPatient({
          name: formData.name,
          age: parseInt(formData.age),
          sex: formData.sex,
          dob: formData.dob,
          blood_group: formData.blood_group,
        });
      }
      setIsModalOpen(false);
      setEditPatientId(null);
      setFormData({ name: "", age: "", sex: "", dob: "", blood_group: "" });
    } catch (error) {
      console.error("Failed to save patient", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobValue = e.target.value;
    const dobDate = new Date(dobValue);
    const today = new Date();
    let calculatedAge = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      calculatedAge--;
    }
    
    setFormData({
      ...formData,
      dob: dobValue,
      age: isNaN(calculatedAge) || calculatedAge < 0 ? "" : calculatedAge.toString()
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight glow-text">Patient Registry</h1>
          <p className="text-white/60 mt-1">Manage and monitor patient scan histories</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:border-white/30 transition-colors text-white"
            />
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => {
                setEditPatientId(null);
                setFormData({ name: "", age: "", sex: "", dob: "", blood_group: "" });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 text-sm font-medium shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              <Plus className="w-4 h-4" /> New Patient
            </button>
          )}
        </div>
      </div>

      <SpotlightCard className="overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <Activity className="w-8 h-8 text-white/50 mb-4" />
              <p className="text-white/60">Loading patients...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-white/50 tracking-wider">
                  <th className="px-6 py-4 font-medium">Patient ID</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Age/Gender</th>
                  <th className="px-6 py-4 font-medium">Blood Group</th>
                  <th className="px-6 py-4 font-medium">Registered Date</th>
                  {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPatients.length === 0 ? (
                   <tr>
                     <td colSpan={isAdmin ? 6 : 5} className="text-center py-10 text-white/50">
                       No patients found.
                     </td>
                   </tr>
                ) : filteredPatients.map((patient, i) => (
                  <motion.tr 
                    key={patient.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => router.push(`/patients/${patient.id}`)}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white/90">
                       {formatPatientId(patient)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/80">
                      {patient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/60">{patient.age} • {patient.sex}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/60">{patient.blood_group}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/60">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                    
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { 
                              setEditPatientId(patient.id);
                              setFormData({
                                name: patient.name,
                                age: patient.age.toString(),
                                sex: patient.sex,
                                dob: patient.dob,
                                blood_group: patient.blood_group
                              });
                              setIsModalOpen(true);
                            }}
                            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={async () => {
                              if(confirm("Are you sure you want to delete this patient?")) {
                                try { await deletePatient(patient.id); } catch(err) { console.error(err); }
                              }
                            }} 
                            className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SpotlightCard>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">{editPatientId ? 'Edit Patient' : 'New Patient Registration'}</h2>
                  <button onClick={() => { setIsModalOpen(false); setEditPatientId(null); }} className="text-white/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleCreatePatient} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Age (Auto-calculated)</label>
                      <input 
                        type="number" 
                        value={formData.age}
                        readOnly
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Sex</label>
                      <select 
                        required
                        value={formData.sex}
                        onChange={e => setFormData({...formData, sex: e.target.value})}
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                      >
                        <option value="" disabled>Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Date of Birth</label>
                      <input 
                        required
                        type="date" 
                        value={formData.dob}
                        onChange={handleDobChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Blood Group</label>
                      <select 
                        required
                        value={formData.blood_group}
                        onChange={e => setFormData({...formData, blood_group: e.target.value})}
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                      >
                        <option value="" disabled>Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => { setIsModalOpen(false); setEditPatientId(null); }}
                      className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isCreating}
                      className="flex-1 px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isCreating ? (editPatientId ? 'Updating...' : 'Registering...') : (editPatientId ? 'Update Patient' : 'Register Patient')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
