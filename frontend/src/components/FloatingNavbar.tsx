"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, LayoutDashboard, Users, User, LogOut, 
  Settings, KeyRound, Trash2, X, RotateCcw, 
  Check, Shield, AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { usePatientStore } from "@/store/usePatientStore";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

// --- Sub-Component: Change Password Modal ---
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword, isLoading } = useAuthStore();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    try {
      await changePassword(oldPassword, newPassword);
      toast.success("Password updated successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-white/70" />
            <h3 className="font-semibold text-white">Security Settings</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-xs hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              {isLoading ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// --- Sub-Component: Previous Patients (Recycle Bin) Modal ---
function RecycleBinModal({ onClose }: { onClose: () => void }) {
  const { deletedPatients, isLoading, fetchDeletedPatients, restorePatient, permanentlyDeletePatient } = usePatientStore();
  const [purgingId, setPurgingId] = useState<number | null>(null);

  useEffect(() => {
    fetchDeletedPatients();
  }, [fetchDeletedPatients]);

  const handleRestore = async (id: number, name: string) => {
    try {
      await restorePatient(id);
      toast.success(`${name} restored successfully!`);
    } catch {
      toast.error("Failed to restore patient record");
    }
  };

  const handlePurge = async (id: number, name: string) => {
    if (purgingId !== id) {
      setPurgingId(id); // Show confirmation prompt first
      return;
    }
    try {
      await permanentlyDeletePatient(id);
      toast.success(`${name} permanently purged.`);
      setPurgingId(null);
    } catch {
      toast.error("Failed to permanently delete patient");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl m-4 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-white/70" />
            <h3 className="font-semibold text-white">Previous Patients (Recycle Bin)</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[450px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs animate-pulse">
              Loading recycle bin items...
            </div>
          ) : deletedPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-3 rounded-full bg-white/5 mb-3 border border-white/5">
                <Trash2 className="w-6 h-6 text-white/20" />
              </div>
              <h4 className="text-sm font-semibold text-white/70 mb-1">Recycle Bin is Empty</h4>
              <p className="text-xs text-white/40">Deleted patient records will accumulate here.</p>
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {deletedPatients.map((p) => {
                const isConfirming = purgingId === p.id;
                // Format UID
                const formatId = `BT-26-${String(p.id).padStart(3, '0')}`;
                
                return (
                  <div 
                    key={p.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{p.name}</span>
                        <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-white/50">{formatId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                        <span>Age: {p.age}</span>
                        <span>•</span>
                        <span>Sex: {p.sex}</span>
                        <span>•</span>
                        <span>Blood: {p.blood_group}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleRestore(p.id, p.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-white/60 hover:text-emerald-400 text-xs transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => handlePurge(p.id, p.name)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
                          isConfirming 
                            ? "border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30" 
                            : "border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-white/60 hover:text-red-400"
                        )}
                      >
                        {isConfirming ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-red-400 animate-bounce" />
                            <span>Confirm Purge?</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                      
                      {isConfirming && (
                        <button
                          onClick={() => setPurgingId(null)}
                          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/40 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Sub-Component: Create Doctor Account Modal (Admin Only) ---
function CreateDoctorModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setLoading(true);
    try {
      await api.post('/auth/create-doctor', {
        username: username.trim(),
        password: password,
      });
      toast.success(`Doctor account '${username.trim()}' registered!`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create doctor account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-white/70" />
            <h3 className="font-semibold text-white">Create Doctor Account</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Doctor Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              placeholder="e.g. dr_smith"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Temporary Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-xs hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// --- Main FloatingNavbar Component ---
export function FloatingNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Settings dropdown and modal states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRecycleModal, setShowRecycleModal] = useState(false);
  const [showCreateDoctorModal, setShowCreateDoctorModal] = useState(false);

  // Close dropdown on outside clicks
  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = () => setShowDropdown(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showDropdown]);

  const isPublicPage = pathname === "/" || pathname === "/login";
  if (isPublicPage || !user) return null; // Hide navbar on public pages or unauthenticated state

  // Dynamic Navigation Items
  const isPatient = user.role === "patient";
  const navItems = isPatient
    ? [
        { 
          name: "My Records", 
          href: `/patients/${user.patient_id}`, 
          icon: User 
        }
      ]
    : [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Patients", href: "/patients", icon: Users },
      ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-5xl px-4">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex items-center justify-between px-6 py-3 rounded-full border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] gap-4 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:border-white/15 transition-all duration-500"
          style={{
            background: "rgba(20, 20, 25, 0.45)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Brand Logo */}
          <Link href={isPatient ? `/patients/${user.patient_id}` : "/dashboard"} className="flex items-center gap-2 group transition-all duration-300">
            <div className="p-2.5 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              <Brain className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="text-lg font-semibold text-white tracking-wide hidden sm:block transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
              NeuroAI
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className={cn("relative z-10 flex items-center gap-1.5 transition-colors", isActive || hoveredIndex === idx ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-white/60")}>
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="hidden xs:block">{item.name}</span>
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-white/10 rounded-full border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <AnimatePresence>
                    {hoveredIndex === idx && !isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-white/10 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>

          {/* User Settings Dropdown Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-full transition-all focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                {getInitials(user.username)}
              </div>
              <span className="text-xs text-white/80 pr-2 hidden md:inline font-medium">
                {user.username}
              </span>
            </button>

            {/* Dropdown Options Box */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 w-56 p-2 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-1 z-[51]"
                  style={{ background: "rgba(9, 9, 11, 0.93)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-white/5 flex flex-col">
                    <span className="text-xs text-white font-semibold">{user.username}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 mt-0.5 font-bold flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-cyan-400" />
                      {user.role} badge
                    </span>
                  </div>

                  {/* Settings Item: Previous Patients (Recycle Bin - Admin Only) */}
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        setShowRecycleModal(true);
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white/50" />
                      <span>Previous Patients</span>
                    </button>
                  )}

                  {/* Settings Item: Create Doctor Account (Admin Only) */}
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        setShowCreateDoctorModal(true);
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <User className="w-3.5 h-3.5 text-white/50" />
                      <span>Create Doctor Account</span>
                    </button>
                  )}

                  {/* Settings Item: Change Password (Clinical Staff Only) */}
                  {(user.role === "admin" || user.role === "doctor") && (
                    <button
                      onClick={() => {
                        setShowPasswordModal(true);
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-white/50" />
                      <span>Change Password</span>
                    </button>
                  )}

                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs rounded-xl text-red-400 hover:bg-red-500/10 transition-all border-t border-white/5 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Popups & Modals */}
      <AnimatePresence>
        {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRecycleModal && <RecycleBinModal onClose={() => setShowRecycleModal(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateDoctorModal && <CreateDoctorModal onClose={() => setShowCreateDoctorModal(false)} />}
      </AnimatePresence>
    </>
  );
}
