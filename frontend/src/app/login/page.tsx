"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Shield, User, KeyRound, ArrowRight, Activity, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"staff" | "patient">("staff");
  
  // Staff Form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Patient Form
  const [patientId, setPatientId] = useState("");

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return toast.error("Please enter both username and password");
    }
    try {
      const user = await login(username, password);
      toast.success(`Welcome back, ${user.username}!`);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid clinical credentials");
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) {
      return toast.error("Please enter your Patient ID");
    }
    try {
      const user = await login(patientId);
      toast.success(`Access granted. Welcome, ${user.username}!`);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.href = `/patients/${user.patient_id}`;
      }
    } catch (err: any) {
      toast.error(err.message || "Patient ID not found or inactive");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden">
      {/* Dynamic visual neon grids in the background */}
      <div className="absolute inset-0 z-[-1] pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-zinc-950/80 m-4"
      >
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4 p-4 rounded-3xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] group hover:border-white/20 transition-colors">
            <Brain className="w-10 h-10 text-white animate-pulse" />
            <div className="absolute inset-0 rounded-3xl bg-white/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            NeuroAI
          </h1>
          <p className="text-xs text-white/50 font-medium tracking-widest uppercase">
            Brain Tumor Detection & Monitoring
          </p>
        </div>

        {/* Tab Selector Switch */}
        <div className="relative flex p-1.5 bg-black/40 border border-white/5 rounded-2xl mb-8">
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex-1 relative py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors z-10 ${
              activeTab === "staff" ? "text-black" : "text-white/60 hover:text-white"
            }`}
          >
            Clinical Staff
          </button>
          <button
            onClick={() => setActiveTab("patient")}
            className={`flex-1 relative py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors z-10 ${
              activeTab === "patient" ? "text-black" : "text-white/60 hover:text-white"
            }`}
          >
            Patient Portal
          </button>

          {/* Animated Selection Background */}
          <motion.div
            layoutId="active-login-tab"
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-white rounded-xl"
            style={{
              left: activeTab === "staff" ? "6px" : "calc(50% + 0px)",
            }}
          />
        </div>

        {/* Forms with AnimatePresence for transitions */}
        <div className="min-h-[260px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeTab === "staff" ? (
              <motion.form
                key="staff-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleStaffSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="e.g. admin or doctor"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl text-sm font-semibold tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] mt-6"
                >
                  {isLoading ? "Authenticating..." : "Access Dashboard"}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>

              </motion.form>
            ) : (
              <motion.form
                key="patient-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePatientSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">
                    Patient ID Code
                  </label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="e.g. BT-26-003"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-base font-mono tracking-widest text-center text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors uppercase"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-white/30 mt-2 text-center">
                    Enter the sequential Patient ID assigned upon clinical registration.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl text-sm font-semibold tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-4"
                >
                  {isLoading ? "Validating ID..." : "Retrieve Medical Records"}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
