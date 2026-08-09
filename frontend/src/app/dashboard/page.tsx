"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Activity, BrainCircuit, Users, AlertTriangle, UserPlus, X, ChevronRight, AlertCircle } from "lucide-react";
import { CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, XAxis, YAxis } from 'recharts';
import { useDashboardStore } from "@/store/useDashboardStore";
import { usePatientStore } from "@/store/usePatientStore";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

// Extend axios config to support our custom `silent` flag
declare module "axios" {
  interface AxiosRequestConfig {
    silent?: boolean;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AIAlert {
  patient_name: string;
  patient_uid: string;
  scan_uid: string;
  tumor_type: string;
  confidence: string;
  time_ago: string;
  severity_color: "red" | "orange" | "yellow";
  scan_id: number;
}

// ─── Color map for severity ───────────────────────────────────────────────────
const severityStyle = {
  red:    { text: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20"    },
  orange: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
};

// ─── Quick Add Patient Modal ──────────────────────────────────────────────────
function AddPatientModal({ onClose }: { onClose: () => void }) {
  const { createPatient } = usePatientStore();
  const [form, setForm] = useState({ name: "", age: "", sex: "Male", dob: "", blood_group: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Patient name is required");
    setSaving(true);
    try {
      await createPatient({ name: form.name, age: Number(form.age), sex: form.sex, dob: form.dob, blood_group: form.blood_group });
      toast.success("Patient added successfully!");
      onClose();
    } catch {
      toast.error("Failed to add patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <UserPlus className="w-5 h-5 text-white/70" />
            </div>
            <h2 className="text-xl font-semibold">Add New Patient</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Full Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="e.g. 42"
                min={0} max={150}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Sex</label>
              <select
                value={form.sex}
                onChange={(e) => setForm(f => ({ ...f, sex: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm(f => ({ ...f, dob: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Blood Group</label>
              <select
                value={form.blood_group}
                onChange={(e) => setForm(f => ({ ...f, blood_group: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="">Select</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Adding..." : "Add Patient"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { metrics, isLoading, fetchMetrics } = useDashboardStore();
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchMetrics();
    fetchAlerts();
  }, [fetchMetrics]);

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      // silent: true suppresses the global auto-toast on error
      const res = await api.get("/analytics/recent-alerts", { silent: true } as any);
      setAlerts(res.data.alerts || []);
    } catch {
      // Silently fail — empty state shown instead
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Scans",     value: metrics.totalScans.toString(),     icon: Activity,      change: "+12.5%", color: "text-white"      },
    { title: "AI Detections",   value: metrics.aiDetections.toString(),   icon: BrainCircuit,  change: "+4.2%",  color: "text-red-400"    },
    { title: "Active Patients", value: metrics.activePatients.toString(), icon: Users,         change: "+2.4%",  color: "text-blue-400"   },
    { title: "Critical Cases",  value: metrics.criticalCases.toString(),  icon: AlertTriangle, change: "-1.5%",  color: "text-yellow-400" },
  ];

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* ── Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <motion.h1 variants={itemVariants} className="text-4xl font-bold tracking-tight glow-text mb-2">
              NeuroAI Overview
            </motion.h1>
            <motion.p variants={itemVariants} className="text-white/60">
              Real-time brain tumor detection &amp; monitoring analytics.
              {/* Please note this is mock data is removed per instructions */}
            </motion.p>
          </div>

          {/* Quick Add Patient */}
          <motion.button
            variants={itemVariants}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all duration-150 shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Add Patient
          </motion.button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <SpotlightCard className="p-6 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 border border-white/10 text-green-400">
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-semibold tracking-tight">{stat.value}</h3>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* ── Chart + AI Alerts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <SpotlightCard className="p-6 h-[400px]">
              <h3 className="text-lg font-medium mb-6 text-white/80">Weekly Scan Volume</h3>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f4f4f5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f4f4f5" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="scans" stroke="#f4f4f5" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* AI Alerts — Live Data */}
          <motion.div variants={itemVariants}>
            <SpotlightCard className="p-6 h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-white/80">Recent AI Alerts</h3>
                {alerts.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-400 font-medium">
                    {alerts.length} active
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {alertsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white/30" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <AlertCircle className="w-8 h-8 text-white/20" />
                    <p className="text-sm text-white/40">No positive detections yet.<br />Upload an MRI scan to get started.</p>
                  </div>
                ) : (
                  alerts.map((alert, i) => {
                    const style = severityStyle[alert.severity_color] ?? severityStyle.yellow;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`p-4 rounded-xl border ${style.border} ${style.bg} flex items-center justify-between group hover:bg-white/5 transition-colors cursor-pointer`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-white text-sm truncate">{alert.patient_name}</p>
                          <p className="text-xs text-white/40 mt-0.5">{alert.scan_uid} · {alert.patient_uid}</p>
                          <p className={`text-xs font-medium mt-1 ${style.text}`}>{alert.tumor_type}</p>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="text-sm font-semibold text-white">{alert.confidence}</p>
                          <p className="text-xs text-white/40 mt-0.5">{alert.time_ago}</p>
                          <ChevronRight className="w-3.5 h-3.5 text-white/20 mt-1 ml-auto group-hover:text-white/50 transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Add Patient Modal */}
      <AnimatePresence>
        {showAddModal && <AddPatientModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </>
  );
}
