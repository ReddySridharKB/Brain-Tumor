"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X, Zap, Timer, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import toast from "react-hot-toast";


// ─── Types ───────────────────────────────────────────────────────────────────

interface EEGScannerProps {
  patientName: string;
  patientId: string;
  patientTumorType: string | null;
  onClose: () => void;
}

// ─── Channel definitions matching the reference image ────────────────────────

interface ChannelConfig {
  label: string;
  generate: (t: number, tumor: boolean) => number;
}

function noise(): number {
  return (Math.random() - 0.5) * 2;
}

const CHANNELS: ChannelConfig[] = [
  {
    label: "rawEEG",
    generate: (t, tumor) => {
      const delta = Math.sin(2 * Math.PI * 1.5 * t) * 15;
      const theta = Math.sin(2 * Math.PI * 6 * t) * 8;
      const alpha = Math.sin(2 * Math.PI * 10 * t) * 12;
      const beta = Math.sin(2 * Math.PI * 22 * t) * 4 + Math.sin(2 * Math.PI * 18 * t) * 3;
      const gamma = Math.sin(2 * Math.PI * 45 * t) * 2;
      let spike = 0;
      const sp = (t * 0.8) % 1;
      if (sp < 0.015) spike = (noise() > 0 ? 1 : -1) * (60 + Math.random() * 40);
      if (tumor) {
        // Dominant pathological delta + chaotic spikes
        const slowDrift = Math.sin(2 * Math.PI * 0.3 * t) * 20;
        const burstDelta = Math.sin(2 * Math.PI * 2 * t) * 35;
        // Frequent sharp spikes — every ~0.4s
        const spikePhase = (t * 2.5 + 0.1) % 1;
        const sharpSpike = spikePhase < 0.04 ? (noise() > 0 ? 1 : -1) * (100 + Math.random() * 80) : 0;
        // Polyspike complexes
        const polySpike = ((t * 4.3) % 1) < 0.02 ? noise() * 120 : 0;
        // Burst-suppression: flatten signal periodically
        const suppress = ((t * 0.15) % 1) > 0.75 ? 0.1 : 1;
        return (slowDrift + burstDelta + delta * 2 + theta * 0.3 + alpha * 0.15 + sharpSpike + polySpike + noise() * 18) * suppress;
      }
      return delta + theta + alpha + beta + gamma + spike + noise() * 5;
    },
  },
  {
    label: "Delta",
    generate: (t, tumor) => {
      const d1 = Math.sin(2 * Math.PI * 1.2 * t) * 30;
      const d2 = Math.sin(2 * Math.PI * 2.5 * t) * 15;
      const d3 = Math.sin(2 * Math.PI * 0.7 * t) * 10;
      if (tumor) {
        // Grossly irregular high-amplitude delta with wandering baseline
        const wander = Math.sin(2 * Math.PI * 0.15 * t) * 25;
        const chaotic = Math.sin(2 * Math.PI * 1.8 * t + Math.sin(t * 3) * 2) * 40;
        const spike = ((t * 1.7) % 1) < 0.03 ? noise() * 70 : 0;
        const d4 = Math.sin(2 * Math.PI * 3.8 * t) * 25;
        return wander + chaotic + d1 * 1.8 + d2 * 1.5 + d3 + d4 + spike + noise() * 12;
      }
      return d1 + d2 + d3 + noise() * 3;
    },
  },
  {
    label: "Theta",
    generate: (t, tumor) => {
      const th1 = Math.sin(2 * Math.PI * 5.5 * t) * 15;
      const th2 = Math.sin(2 * Math.PI * 7 * t) * 8;
      const th3 = Math.sin(2 * Math.PI * 4.2 * t) * 6;
      if (tumor) {
        // Focal slowing with sharp transients and amplitude modulation
        const modulation = 1 + Math.sin(2 * Math.PI * 0.4 * t) * 0.6;
        const focalSlow = Math.sin(2 * Math.PI * 3.5 * t) * 22;
        const sharpWave = ((t * 3.1) % 1) < 0.025 ? (noise() > 0 ? 1 : -1) * 50 : 0;
        const irregTheta = Math.sin(2 * Math.PI * 6.3 * t + Math.sin(t * 2) * 1.5) * 12;
        return (th1 * 2 + th2 * 1.5 + focalSlow + irregTheta + sharpWave + noise() * 10) * modulation;
      }
      return th1 + th2 + th3 + noise() * 3;
    },
  },
  {
    label: "Alpha",
    generate: (t, tumor) => {
      const a1 = Math.sin(2 * Math.PI * 10 * t) * 10;
      const a2 = Math.sin(2 * Math.PI * 11.5 * t) * 5;
      const a3 = Math.sin(2 * Math.PI * 8.5 * t) * 4;
      if (tumor) {
        // Severely disrupted alpha — intermittent dropout + spikes
        const dropout = ((t * 0.5) % 1) > 0.6 ? 0.05 : 1; // signal drops out
        const spike = ((t * 5.2) % 1) < 0.015 ? noise() * 35 : 0;
        const jitter = Math.sin(2 * Math.PI * 9.7 * t + noise() * 0.8) * 6;
        return (a1 * 0.25 + a2 * 0.15 + jitter + spike + noise() * 7) * dropout;
      }
      return a1 + a2 + a3 + noise() * 2;
    },
  },
  {
    label: "Beta",
    generate: (t, tumor) => {
      const b1 = Math.sin(2 * Math.PI * 18 * t) * 5;
      const b2 = Math.sin(2 * Math.PI * 22 * t) * 4;
      const b3 = Math.sin(2 * Math.PI * 27 * t) * 3;
      const b4 = Math.sin(2 * Math.PI * 15 * t) * 3;
      if (tumor) {
        // Wild burst-suppression with explosive high-amplitude segments
        const burstCycle = (t * 0.7) % 1;
        const burstGain = burstCycle < 0.35 ? 4 : burstCycle < 0.5 ? 0.2 : 1.5;
        const spike = ((t * 6.3) % 1) < 0.02 ? noise() * 25 : 0;
        return (b1 + b2 + b3 + b4 + spike + noise() * 8) * burstGain;
      }
      return b1 + b2 + b3 + b4 + noise() * 2;
    },
  },
  {
    label: "Gamma",
    generate: (t, tumor) => {
      const g1 = Math.sin(2 * Math.PI * 40 * t) * 3;
      const g2 = Math.sin(2 * Math.PI * 55 * t) * 2;
      const g3 = Math.sin(2 * Math.PI * 70 * t) * 1.5;
      const g4 = Math.sin(2 * Math.PI * 85 * t) * 1;
      if (tumor) {
        // Chaotic high-frequency bursts with amplitude explosions
        const burstCycle = (t * 1.2) % 1;
        const burstGain = burstCycle < 0.2 ? 5 : burstCycle < 0.35 ? 0.15 : 1.8;
        const spike = ((t * 8.7) % 1) < 0.03 ? noise() * 18 : 0;
        return (g1 + g2 + g3 + g4 + spike + noise() * 7) * burstGain;
      }
      return g1 + g2 + g3 + g4 + noise() * 2.5;
    },
  },
];

const INIT_DURATION = 5;
const RAMP_DURATION = 5;
const TRACE_COLOR = "#4a90d9"; // Steel blue matching reference image
const TRACE_COLOR_DIM = "rgba(74, 144, 217, 0.12)";

// ─── Impedance bar (init phase) ─────────────────────────────────────────────

function ImpedanceBar({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-3 text-xs font-mono"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <span className="text-white/40 w-16 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[180px]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500/80 to-blue-400/60"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: delay + 0.2, duration: 2.5, ease: "easeOut" }}
        />
      </div>
      <motion.span
        className="text-blue-400/70 w-8 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 2.5 }}
      >
        OK
      </motion.span>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function EEGScanner({ patientName, patientId, patientTumorType, onClose }: EEGScannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const [isTumorMode, setIsTumorMode] = useState<boolean>(patientTumorType !== null);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [phase, setPhase] = useState<"init" | "ramp" | "running">("init");
  
  // Connection states
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  const checkConnection = useCallback(async () => {
    setCheckingConnection(true);
    try {
      const res = await api.get("/eeg/status");
      if (res.data.connected) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error("Error checking EEG status", err);
      setIsConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    // Live heartbeat polling to detect mid-scan disconnections
    const intervalId = setInterval(async () => {
      try {
        const res = await api.get("/eeg/status");
        if (!res.data.connected) {
          setIsConnected(false);
        } else {
          setIsConnected(true);
        }
      } catch {
        setIsConnected(false);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [checkConnection]);

  const modeRef = useRef(isTumorMode);
  useEffect(() => { modeRef.current = isTumorMode; }, [isTumorMode]);

  const formatTime = useCallback((sec: number): string => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  // ─── Canvas rendering loop ─────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    startTimeRef.current = performance.now();

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const LABEL_WIDTH = 64;
    const SAMPLE_RATE = 256;

    const draw = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      setElapsedSec(Math.floor(elapsed));

      if (elapsed < INIT_DURATION) setPhase("init");
      else if (elapsed < INIT_DURATION + RAMP_DURATION) setPhase("ramp");
      else setPhase("running");

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const channelH = H / CHANNELS.length;
      const traceW = W - LABEL_WIDTH;
      const tumor = modeRef.current;

      // Amplitude envelope
      let ampGain = 0;
      if (elapsed < INIT_DURATION) {
        ampGain = 0;
      } else if (elapsed < INIT_DURATION + RAMP_DURATION) {
        const rampT = (elapsed - INIT_DURATION) / RAMP_DURATION;
        ampGain = rampT * rampT;
      } else {
        ampGain = 1;
      }

      // ── Clear ──
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // ── Channel separators (dark red/brown lines like reference) ──
      ctx.strokeStyle = "rgba(180, 80, 80, 0.25)";
      ctx.lineWidth = 1;
      for (let ch = 1; ch < CHANNELS.length; ch++) {
        const y = ch * channelH;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      // Top and bottom borders
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(W, 0);
      ctx.moveTo(0, H); ctx.lineTo(W, H);
      ctx.stroke();

      // ── Y-axis scale ticks per channel ──
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let ch = 0; ch < CHANNELS.length; ch++) {
        const midY = ch * channelH + channelH / 2;
        // Zero line
        ctx.beginPath();
        ctx.moveTo(LABEL_WIDTH, midY);
        ctx.lineTo(W, midY);
        ctx.stroke();
      }

      // ── Channel labels ──
      ctx.font = "11px ui-monospace, 'Cascadia Code', monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let ch = 0; ch < CHANNELS.length; ch++) {
        const midY = ch * channelH + channelH / 2;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(CHANNELS[ch].label, LABEL_WIDTH - 8, midY);
      }

      // ── Label separator ──
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LABEL_WIDTH, 0);
      ctx.lineTo(LABEL_WIDTH, H);
      ctx.stroke();

      // ── Draw EEG traces ──
      if (ampGain > 0) {
        const visibleSamples = Math.floor(traceW / 1.2);
        const totalSamples = Math.floor(elapsed * SAMPLE_RATE);

        for (let ch = 0; ch < CHANNELS.length; ch++) {
          const baseY = ch * channelH + channelH / 2;
          const maxAmp = channelH * 0.42;
          const channelGen = CHANNELS[ch].generate;

          // Normalisation scale per channel type
          const scales: Record<string, number> = {
            rawEEG: 100, Delta: 60, Theta: 30,
            Alpha: 20, Beta: 15, Gamma: 12,
          };
          const scale = scales[CHANNELS[ch].label] || 50;

          // Glow pass
          ctx.beginPath();
          ctx.strokeStyle = TRACE_COLOR_DIM;
          ctx.lineWidth = 3;
          ctx.lineJoin = "round";

          for (let i = 0; i < visibleSamples; i++) {
            const sampleIdx = totalSamples - visibleSamples + i;
            if (sampleIdx < 0) continue;
            const t = sampleIdx / SAMPLE_RATE;
            const raw = channelGen(t, tumor);
            const normalised = (raw / scale) * maxAmp * ampGain;
            const x = LABEL_WIDTH + (i / visibleSamples) * traceW;
            const y = baseY - normalised;
            if (i === 0 || sampleIdx <= 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Sharp trace
          ctx.beginPath();
          ctx.strokeStyle = TRACE_COLOR;
          ctx.lineWidth = 1.1;
          ctx.lineJoin = "round";

          for (let i = 0; i < visibleSamples; i++) {
            const sampleIdx = totalSamples - visibleSamples + i;
            if (sampleIdx < 0) continue;
            const t = sampleIdx / SAMPLE_RATE;
            const raw = channelGen(t, tumor);
            const normalised = (raw / scale) * maxAmp * ampGain;
            const x = LABEL_WIDTH + (i / visibleSamples) * traceW;
            const y = baseY - normalised;
            if (i === 0 || sampleIdx <= 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // ── Flat baseline during init ──
      if (ampGain === 0) {
        ctx.strokeStyle = "rgba(74, 144, 217, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        for (let ch = 0; ch < CHANNELS.length; ch++) {
          const midY = ch * channelH + channelH / 2;
          ctx.beginPath();
          ctx.moveTo(LABEL_WIDTH, midY);
          ctx.lineTo(W, midY);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [checkingConnection, isConnected]);

  // ─── Render ─────────────────────────────────────────────────────────────

  if (checkingConnection) {
    return (
      <div className="flex items-center justify-center p-12 bg-[#0a0a0a] rounded-2xl border border-white/10 text-white/50 font-mono text-sm min-h-[250px]">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          Checking EEG Head Band connection...
        </motion.div>
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="p-8 bg-[#0a0a0a] rounded-2xl border border-red-500/20 text-center space-y-6 max-w-md mx-auto shadow-2xl"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">EEG Head Band is not Connected</h3>
          <p className="text-xs text-white/40 leading-relaxed">
            Please ensure your EEG device is powered on, plugged into a USB port (e.g. COM7), and the drivers are installed.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={checkConnection}
            className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            Retry Connection
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-xs hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 12 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="relative w-full rounded-2xl border border-white/10 overflow-hidden bg-[#0a0a0a] shadow-2xl shadow-black/60"
    >
      {/* ─── Header Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-black/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white tracking-wide">EEG Monitor</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3 text-xs font-mono text-white/50">
            <span>{patientName}</span>
            <span className="text-white/20">|</span>
            <span>ID: {patientId}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Simple toggle */}
          <button
            onClick={() => setIsTumorMode(v => !v)}
            className="relative w-10 h-5 rounded-full transition-colors duration-300 border border-white/10"
            style={{ backgroundColor: isTumorMode ? "rgba(59, 130, 246, 0.3)" : "rgba(255,255,255,0.08)" }}
            title={isTumorMode ? "Pathological mode" : "Normal mode"}
          >
            <motion.div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
              animate={{ left: isTumorMode ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-white/40">
            <Timer className="w-3 h-3" />
            <span>{formatTime(elapsedSec)}</span>
          </div>

          {/* Recording indicator */}
          {phase === "running" && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-red-400/70 uppercase">Rec</span>
            </div>
          )}

          {/* Exit */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/20 hover:border-red-500/30 transition-colors text-xs font-mono text-white/60 hover:text-red-400"
          >
            <X className="w-3.5 h-3.5" />
            Exit Scan
          </button>
        </div>
      </div>

      {/* ─── Canvas ──────────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: 420 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ imageRendering: "auto" }}
        />

        {/* Init overlay */}
        <AnimatePresence>
          {phase === "init" && (
            <motion.div
              key="init-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.8 } }}
              className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm z-10"
            >
              <div className="text-center space-y-5">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center justify-center gap-2 text-sm font-mono text-white/70"
                >
                  <Zap className="w-4 h-4 text-yellow-400/70" />
                  Initializing EEG... Checking electrode impedance
                </motion.div>

                <div className="space-y-2 w-64 mx-auto">
                  {CHANNELS.map((ch, i) => (
                    <ImpedanceBar key={ch.label} label={ch.label} delay={i * 0.4} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ramp indicator */}
        <AnimatePresence>
          {phase === "ramp" && (
            <motion.div
              key="ramp-label"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.5 } }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm"
            >
              <span className="text-xs font-mono text-white/50 flex items-center gap-2">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-blue-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                Signal ramping up...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Status ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-white/[0.06] bg-black/40">
        <div className="text-[10px] font-mono text-white/30">
          Gain: 10μV/mm  •  Speed: 30mm/s  •  Filter: 0.5-70Hz
        </div>
        <div className="text-[10px] font-mono text-white/30">
          {phase === "init" ? "INITIALIZING" : phase === "ramp" ? "CALIBRATING" : "RECORDING"}
          {" • "}Bands: rawEEG / δ / θ / α / β / γ
        </div>
      </div>
    </motion.div>
  );
}
