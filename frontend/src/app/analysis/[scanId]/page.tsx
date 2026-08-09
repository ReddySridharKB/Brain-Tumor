"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Brain, Activity, Download, AlertTriangle, Layers, Maximize2 } from "lucide-react";
import { useScanStore } from "@/store/useScanStore";
import { api } from "@/lib/api";


export default function AnalysisPage() {
  const params = useParams();
  const scanId = params.scanId as string;
  const { currentScan, fetchScanById } = useScanStore();
  
  const [activeTab, setActiveTab] = useState<"original" | "highlighted" | "heatmap">("heatmap");

  useEffect(() => {
    if (scanId && (!currentScan || currentScan.id !== parseInt(scanId))) {
      fetchScanById(parseInt(scanId));
    }
  }, [scanId, currentScan, fetchScanById]);

  if (!currentScan) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Brain className="w-10 h-10 text-white/50 mb-4" />
          <p className="text-white/60">Loading scan analysis...</p>
        </div>
      </div>
    );
  }

  // Use the backend's provided base URL or full path to render images
  // Assume the API provides absolute paths or we prefix it with the API base URL.
  // The backend might return relative paths, e.g., "storage/patients/1/image.jpg"
  // Let's create a helper to get the full image URL.
  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    const normalizedPath = path.replace(/\\/g, '/');
    return `http://localhost:8000/api/v1/static/${encodeURIComponent(normalizedPath)}`;
  };

  const handleExportReport = async () => {
    if (!currentScan) return;
    try {
      const response = await api.get(`/report/pdf/${currentScan.id}`, {
        responseType: "blob",
      });
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_scan_${currentScan.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight glow-text">Analysis Results</h1>
          <p className="text-white/60">Scan ID: {currentScan.id} • Patient ID: {currentScan.patient_id} • Processed via NeuroAI v2</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm font-medium">
            <Activity className="w-4 h-4" /> Compare
          </button>
          <button 
            onClick={handleExportReport}
            className="px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 text-sm font-medium shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <SpotlightCard className="p-1 rounded-2xl">
            <div className="relative aspect-square md:aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/5">
              {/* MRI Image Viewer */}
              {activeTab === "original" && currentScan.original_image_path ? (
                 <img src={getImageUrl(currentScan.original_image_path)!} alt="Original MRI" className="w-full h-full object-contain" />
              ) : activeTab === "highlighted" && currentScan.highlighted_image_path ? (
                 <img src={getImageUrl(currentScan.highlighted_image_path)!} alt="Highlighted MRI" className="w-full h-full object-contain" />
              ) : activeTab === "heatmap" && currentScan.heatmap_path ? (
                 <img src={getImageUrl(currentScan.heatmap_path)!} alt="Heatmap" className="w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-black flex items-center justify-center">
                  <p className="text-white/30 font-mono">Image Not Available</p>
                  {activeTab === "highlighted" && (
                    <div className="absolute top-1/3 left-1/3 w-32 h-32 border-2 border-red-500 rounded-full animate-pulse opacity-50"></div>
                  )}
                  {activeTab === "heatmap" && (
                    <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-[radial-gradient(circle,_rgba(255,0,0,0.8)_0%,_rgba(255,165,0,0.5)_40%,_rgba(0,0,0,0)_70%)] rounded-full mix-blend-screen blur-md"></div>
                  )}
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="p-2 rounded-lg bg-black/50 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors">
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
                <button className="p-2 rounded-lg bg-black/50 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors">
                  <Layers className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center p-1 rounded-full bg-black/50 backdrop-blur border border-white/10">
                {(["original", "highlighted", "heatmap"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                      activeTab === tab ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* AI Analysis Panel */}
        <div className="space-y-6">
          <SpotlightCard className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-medium mb-6">
              <Brain className="w-5 h-5 text-blue-400" />
              AI Diagnosis
            </h3>
            
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-400 font-medium">{currentScan.tumor_type || "Unknown"}</span>
                  <span className="text-red-400 font-bold">{currentScan.probability ? `${(currentScan.probability * 100).toFixed(1)}%` : "N/A"}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentScan.probability || 0) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-red-500 to-red-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-white/5 bg-white/5">
                  <p className="text-xs text-white/50 mb-1">Severity</p>
                  <p className="font-medium text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {currentScan.severity || "Unknown"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-white/5 bg-white/5">
                  <p className="text-xs text-white/50 mb-1">Risk</p>
                  <p className="font-medium">{currentScan.tumor_risk || "Unknown"}</p>
                </div>
                <div className="col-span-2 p-3 rounded-lg border border-white/5 bg-white/5">
                  <p className="text-xs text-white/50 mb-1">Location</p>
                  <p className="font-medium">{currentScan.tumor_location || "Unknown"}</p>
                </div>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6">
             <h3 className="text-lg font-medium mb-4 text-white/90">Medical Summary</h3>
             <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
               {(currentScan.ai_summary || "No summary available.")
                 .replace("Please note this is mock data and should not be used for actual medical diagnosis. Consult a qualified specialist for accurate assessment.", "")
                 .trim()}
             </p>
             <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-white/40 italic">
                  Disclaimer: This analysis is generated by AI and must be reviewed by a certified radiologist or neurologist before any clinical decisions are made.
                </p>
             </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}

