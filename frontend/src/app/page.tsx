"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Brain, ShieldAlert, ArrowRight, Sparkles, Activity, ShieldCheck, FileText, Database } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();

  const portalHref = isAuthenticated && user
    ? (user.role === "patient" ? `/patients/${user.patient_id}` : "/dashboard")
    : "/login";

  const portalHeaderLabel = isAuthenticated && user
    ? (user.role === "patient" ? "My Records" : "Go to Dashboard")
    : "Launch Portal";

  const portalHeroLabel = isAuthenticated && user
    ? (user.role === "patient" ? "Access Medical Records" : "Go to Clinical Dashboard")
    : "Launch Diagnostics Portal";
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  const glowVariants: Variants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.3, 0.5, 0.3],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans">
      
      {/* ─── Cyber-Grid Visual Overlays ─── */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,212,255,0.08),rgba(255,255,255,0))] pointer-events-none z-0" />

      {/* Blurred Neon Orbs */}
      <motion.div
        variants={glowVariants}
        animate="animate"
        className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        variants={glowVariants}
        animate="animate"
        className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none z-0"
      />

      {/* ─── Header Navigation ─── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Brain className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="text-lg font-bold tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              NeuroAI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-white/50">
            <a href="#overview" className="hover:text-white transition-colors">Overview</a>
            <a href="#tech" className="hover:text-white transition-colors">Core Tech</a>
            <a href="#security" className="hover:text-white transition-colors">Clinical Trust</a>
          </nav>

          <div>
            <Link
              href={portalHref}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-95"
            >
              <span>{portalHeaderLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 pt-40 pb-20 z-10 w-full flex flex-col items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/30 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3 h-3" />
            <span>Next-Generation Clinician Suite</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] text-white"
          >
            The Future of <span className="bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,212,255,0.15)]">Neuro-Diagnostics</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-white/50 mb-10 leading-relaxed font-light"
          >
            A high-fidelity clinical application empowering neurosurgeons, radiologists, and medical teams with deep-learning brain tumor segmentation, dynamic telemetry, and report automation.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24"
          >
            <Link
              href={portalHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-black text-sm font-semibold tracking-wide hover:bg-white/95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
            >
              <span>{portalHeroLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#overview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-white/70 hover:text-white text-sm font-semibold tracking-wide transition-all"
            >
              Explore Features
            </a>
          </motion.div>
        </motion.div>

        {/* ─── Feature Bento Grid (Section: Overview) ─── */}
        <section id="overview" className="w-full pt-12 pb-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Modular Intelligence</h2>
            <p className="text-sm text-white/40">Clinically mapped capabilities engineered for absolute accuracy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: AI Segmentation */}
            <div className="md:col-span-2 p-8 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Automated AI Tumor Segmentation</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-lg">
                    Leverage advanced image analysis to automatically localize and segment tumor borders in less than 15 seconds. Highlights regions with dynamic opacity overlays.
                  </p>
                </div>
                <div className="flex gap-4.5 text-[10px] text-white/30 uppercase tracking-widest font-mono">
                  <span>FastAPI Pipelines</span>
                  <span>•</span>
                  <span>OpenCV Filters</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: 3D Visualization */}
            <div className="p-8 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Comparison Engine</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Compare scanning history over sequential timelines. Generates analytical progression notes detailing volumetric shifts.
                  </p>
                </div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                  <span>Scan Comparison</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Telemetry */}
            <div className="p-8 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">EEG Signal Simulator</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Visualizes active simulated EEG telemetry waveforms mapped directly alongside historical clinical patient profiles.
                  </p>
                </div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                  <span>Dynamic Canvas</span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Reports */}
            <div className="md:col-span-2 p-8 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">High-Fidelity Clinical Reports</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-lg">
                    Instantly compile scan metadata, AI diagnostics, overlays, and patient details into beautiful exportable medical PDFs for hospital records or second opinions.
                  </p>
                </div>
                <div className="flex gap-4.5 text-[10px] text-white/30 uppercase tracking-widest font-mono">
                  <span>ReportLab Engine</span>
                  <span>•</span>
                  <span>PDF Export</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── Tech Stack (Section: Tech) ─── */}
        <section id="tech" className="w-full py-20 border-t border-white/5 flex flex-col items-center">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Engineered Stack</h2>
            <p className="text-xs text-white/40 uppercase tracking-widest">Powering high-performance clinical applications</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl">
            {[
              { name: "Next.js 15 & TS", desc: "Type-safe interface layout", icon: Brain },
              { name: "FastAPI Engine", desc: "High-performance API", icon: Database },
              { name: "SQLite & Models", desc: "Non-reusable patient ID logs", icon: ShieldCheck },
              { name: "TailwindCSS & Framer", desc: "Immersive fluid dashboard", icon: Activity }
            ].map((tech, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-zinc-950/40 text-center hover:border-white/10 transition-colors">
                <tech.icon className="w-6 h-6 text-white/40 mx-auto mb-3" />
                <h4 className="text-xs font-semibold text-white/80 mb-1">{tech.name}</h4>
                <p className="text-[10px] text-white/40">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Trust & Safety (Section: Security) ─── */}
        <section id="security" className="w-full pt-20 pb-12 border-t border-white/5">
          <div className="p-8 rounded-3xl border border-yellow-500/10 bg-yellow-500/[0.02] flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-500 mb-1">Clinical Disclaimer & Security</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                NeuroAI is an interactive clinician assistance dashboard designed for experimental and demonstration purposes. All analysis, predictions, and scans represent mock-synthesized metrics and must be validated by board-certified radiologists before medical deployment.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer ─── */}
      <footer className="w-full py-8 border-t border-white/5 px-6 md:px-12 text-center text-[10px] text-white/30 tracking-wider uppercase font-mono z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} NeuroAI inc. All rights reserved.</span>
          <span>Designed with high-fidelity aesthetics.</span>
        </div>
      </footer>

    </div>
  );
}
