"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { EEGScanner } from "@/components/EEGScanner";
import { Brain, Activity, Download, AlertTriangle, Layers, Maximize2, UploadCloud, File, X, CheckCircle2, FileText, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScanStore } from "@/store/useScanStore";
import { usePatientStore } from "@/store/usePatientStore";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";


export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = parseInt(params.id as string);
  
  const { user } = useAuthStore();
  const isPatient = user?.role === "patient";
  const isStaff = user?.role === "admin" || user?.role === "doctor";

  const { patients, fetchPatients, currentPatient, fetchPatientById } = usePatientStore();
  const { currentScan, fetchScanById, uploadScan, uploadStatus, resetUploadState, fetchScanHistory, scans } = useScanStore();
  
  const [activeMainTab, setActiveMainTab] = useState<"overview" | "upload" | "analysis" | "compare" | "reports">("overview");
  const [activeImageTab, setActiveImageTab] = useState<"original" | "highlighted">("highlighted");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Compare state
  const [compareScan1Id, setCompareScan1Id] = useState<number | "">("");
  const [compareScan2Id, setCompareScan2Id] = useState<number | "">("");
  const [compareResult, setCompareResult] = useState<{ comparison_result: string, growth_percentage: number, progression_summary: string } | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // EEG Scanner state
  const [showEEG, setShowEEG] = useState(false);

  const patient = currentPatient || patients.find(p => p.id === patientId);

  // Determine patient's primary tumor type from scan history (for EEG default)
  const patientTumorType = scans && scans.length > 0
    ? scans.find(s => s.tumor_type && s.tumor_type !== "None")?.tumor_type || null
    : null;

  useEffect(() => {
    if (isPatient) {
      fetchPatientById(patientId);
    } else {
      if (patients.length === 0) {
        fetchPatients();
      }
      fetchPatientById(patientId);
    }
    if (patientId) {
      fetchScanHistory(patientId).then(() => {
        // We will set the defaults for comparison if scans are available when the state updates.
      });
    }
  }, [patientId, fetchPatients, fetchPatientById, isPatient, patients.length, fetchScanHistory]);

  // Set default compare scans once history is loaded
  useEffect(() => {
    if (scans && scans.length >= 2 && !compareScan1Id && !compareScan2Id) {
      setCompareScan1Id(scans[0].id);
      setCompareScan2Id(scans[1].id);
    } else if (scans && scans.length === 1 && !compareScan1Id) {
      setCompareScan1Id(scans[0].id);
    }
  }, [scans]);

  const handleCompare = async () => {
    if (!compareScan1Id || !compareScan2Id) return;
    setIsComparing(true);
    setCompareResult(null);

    try {
      const scan1 = scans.find(s => s.id === compareScan1Id);
      const scan2 = scans.find(s => s.id === compareScan2Id);
      if (!scan1 || !scan2) throw new Error("Scan not found");

      // Determine which is older / newer
      const older = new Date(scan1.uploaded_at) <= new Date(scan2.uploaded_at) ? scan1 : scan2;
      const newer = older === scan1 ? scan2 : scan1;

      const olderProb = older.probability ?? 0;
      const newerProb = newer.probability ?? 0;
      const probDelta = newerProb - olderProb;
      const growthPct = olderProb > 0
        ? parseFloat(((probDelta / olderProb) * 100).toFixed(1))
        : parseFloat((probDelta * 100).toFixed(1));

      // Determine comparison status
      let status = "stable";
      if (growthPct > 5) status = "progressed";
      else if (growthPct < -5) status = "improved";
      else if (older.tumor_type !== newer.tumor_type) status = "changed";

      // Build progression summary from stored history
      const olderDate = new Date(older.uploaded_at).toLocaleDateString();
      const newerDate = new Date(newer.uploaded_at).toLocaleDateString();
      const daysBetween = Math.round((new Date(newer.uploaded_at).getTime() - new Date(older.uploaded_at).getTime()) / 86400000);

      let summary = `Comparing ${older.scan_uid} (${olderDate}) with ${newer.scan_uid} (${newerDate}) — ${daysBetween} day interval.\n\n`;

      // Type comparison
      if (older.tumor_type === newer.tumor_type) {
        summary += `Tumor type consistent: ${newer.tumor_type || "Unknown"}. `;
      } else {
        summary += `⚠ Tumor type changed from ${older.tumor_type || "Unknown"} to ${newer.tumor_type || "Unknown"}. `;
      }

      // Probability comparison
      if (Math.abs(probDelta) < 0.02) {
        summary += `Detection probability stable at ${(newerProb * 100).toFixed(0)}%. `;
      } else if (probDelta > 0) {
        summary += `Detection probability increased from ${(olderProb * 100).toFixed(0)}% to ${(newerProb * 100).toFixed(0)}% (+${(probDelta * 100).toFixed(0)}%). `;
      } else {
        summary += `Detection probability decreased from ${(olderProb * 100).toFixed(0)}% to ${(newerProb * 100).toFixed(0)}% (${(probDelta * 100).toFixed(0)}%). `;
      }

      // Severity comparison
      if (older.severity && newer.severity) {
        if (older.severity === newer.severity) {
          summary += `Severity unchanged at ${newer.severity}. `;
        } else {
          summary += `Severity shifted from ${older.severity} to ${newer.severity}. `;
        }
      }

      // Location comparison
      if (older.tumor_location && newer.tumor_location) {
        if (older.tumor_location === newer.tumor_location) {
          summary += `Location consistent: ${newer.tumor_location}.`;
        } else {
          summary += `Location changed from ${older.tumor_location} to ${newer.tumor_location}.`;
        }
      }

      // Simulate a brief processing delay for UX
      await new Promise(r => setTimeout(r, 600));

      setCompareResult({
        comparison_result: status,
        growth_percentage: growthPct,
        progression_summary: summary.trim(),
      });
    } catch (error) {
      console.error(error);
      alert("Failed to run comparison");
    } finally {
      setIsComparing(false);
    }
  };

  const handleExportComparisonReport = async () => {
    if (!compareScan1Id || !compareScan2Id) return;
    try {
      const response = await api.get(`/report/comparison/pdf/${compareScan1Id}/${compareScan2Id}`, {
        responseType: "blob",
      });
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison_report_${compareScan1Id}_vs_${compareScan2Id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting comparison report:", error);
      alert("Failed to export comparison report. Please try again.");
    }
  };


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

  // Upload Handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  const handleUpload = async () => {
    if (!file) return;
    try {
      const scan = await uploadScan(patientId, file);
      setTimeout(() => {
        fetchScanById(scan.id);
        setActiveMainTab("analysis");
        resetUploadState();
        setFile(null);
        fetchScanHistory(patientId);
      }, 1500);
    } catch (err) {
      console.error("Failed to upload scan", err);
    }
  };

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Brain className="w-10 h-10 text-white/50 mb-4" />
          <p className="text-white/60">Loading patient data...</p>
        </div>
      </div>
    );
  }

  const tabs = isPatient 
    ? (["overview", "reports"] as const)
    : (["overview", "upload", "compare", "reports"] as const);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {!isPatient && (
          <Link href="/patients" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Patients
          </Link>
        )}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight glow-text">{patient.name}</h1>
            <p className="text-white/60">
              ID: {`BT-${new Date(patient.created_at).getFullYear().toString().slice(-2)}-${String(patient.id).padStart(3, '0')}`} • {patient.age} yrs • {patient.sex} • Blood: {patient.blood_group}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 p-1 bg-white/5 rounded-full border border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveMainTab(tab); setShowEEG(false); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                    activeMainTab === tab && !showEEG ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* EEG Scanner Button (Clinical Staff Only) */}
            {isStaff && (
              <button
                onClick={() => setShowEEG(!showEEG)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  showEEG
                    ? "bg-blue-500/15 border-blue-500/25 text-blue-400"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <Activity className="w-4 h-4" />
                EEG Scanner
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── EEG Scanner (Inline) ─────────────────────────────────── */}
      <AnimatePresence>
        {showEEG && (
          <EEGScanner
            patientName={patient.name}
            patientId={`BT-${new Date(patient.created_at).getFullYear().toString().slice(-2)}-${String(patient.id).padStart(3, '0')}`}
            patientTumorType={patientTumorType}
            onClose={() => setShowEEG(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Main Content Tabs ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMainTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeMainTab === "overview" && (
            <div className="space-y-6">
               <SpotlightCard className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Scan History</h3>
                  {scans && scans.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-xs uppercase text-white/50 tracking-wider">
                            <th className="px-6 py-4 font-medium">Scan ID</th>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium">Tumor Type</th>
                            <th className="px-6 py-4 font-medium">Risk</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {scans.map((scan) => (
                            <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-white/80">{scan.scan_uid}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-white/60">{new Date(scan.uploaded_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-white/80">{scan.tumor_type || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-white/60">{scan.tumor_risk || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button 
                                  onClick={() => { fetchScanById(scan.id); setActiveMainTab("analysis"); }}
                                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors"
                                >
                                  View Analysis
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-white/50">No scans found for this patient.</div>
                  )}
               </SpotlightCard>
            </div>
          )}

          {activeMainTab === "upload" && (
            <SpotlightCard className="p-1 max-w-3xl mx-auto mt-8">
              <div 
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 flex flex-col items-center justify-center min-h-[400px]",
                  isDragging ? "border-white/50 bg-white/5" : "border-white/10 hover:border-white/20",
                  uploadStatus !== "idle" && uploadStatus !== "error" && "border-transparent bg-transparent"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <AnimatePresence mode="wait">
                  {(uploadStatus === "idle" || uploadStatus === "error") && !file && (
                    <motion.div 
                      key="upload-prompt"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center text-center space-y-4"
                    >
                      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 relative group">
                        <div className="absolute inset-0 rounded-full bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <UploadCloud className="w-10 h-10 text-white/80" />
                      </div>
                      <h3 className="text-xl font-medium">Drag & Drop Scan</h3>
                      <p className="text-sm text-white/50 max-w-sm">
                        Supported formats: DICOM, NIfTI, PNG, JPEG. Maximum file size 500MB.
                      </p>
                      <label className="mt-8 px-6 py-3 rounded-full bg-white text-black font-medium cursor-pointer hover:bg-white/90 transition-colors">
                        Browse Files
                        <input type="file" className="hidden" accept=".dcm,.nii,.png,.jpeg,.jpg" onChange={handleFileChange} />
                      </label>
                    </motion.div>
                  )}

                  {(uploadStatus === "idle" || uploadStatus === "error") && file && (
                    <motion.div 
                      key="file-preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full max-w-md"
                    >
                      <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-white/10">
                            <File className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-white/50">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button onClick={() => setFile(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <X className="w-5 h-5 text-white/70" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={handleUpload}
                        className="w-full py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                      >
                        Start Analysis
                      </button>
                    </motion.div>
                  )}

                  {(uploadStatus === "uploading" || uploadStatus === "analyzing") && (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center space-y-6"
                    >
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center">
                          {uploadStatus === "uploading" ? (
                            <UploadCloud className="w-10 h-10 animate-pulse text-white/50" />
                          ) : (
                            <Brain className="w-10 h-10 animate-pulse text-blue-400" />
                          )}
                        </div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                          <motion.circle 
                            cx="50" cy="50" r="48" fill="none" stroke="#fff" strokeWidth="4"
                            strokeDasharray="301"
                            initial={{ strokeDashoffset: 301 }}
                            animate={{ strokeDashoffset: uploadStatus === "uploading" ? 150 : 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                          />
                        </svg>
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-medium animate-pulse">
                          {uploadStatus === "uploading" ? "Encrypting & Uploading..." : "AI Neural Analysis in Progress..."}
                        </h3>
                      </div>
                    </motion.div>
                  )}

                  {uploadStatus === "complete" && (
                    <motion.div 
                      key="complete"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center space-y-6"
                    >
                      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                        <CheckCircle2 className="w-12 h-12 text-green-400" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-medium text-green-400">Analysis Complete</h3>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SpotlightCard>
          )}

          {activeMainTab === "analysis" && (
            currentScan ? (
              <div className="flex flex-col gap-6 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  <SpotlightCard className="p-1 rounded-2xl flex flex-col h-full">
                    <div className="relative w-full h-full min-h-[300px] md:min-h-[400px] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/5">
                      {activeImageTab === "original" && currentScan.original_image_path ? (
                         <img src={getImageUrl(currentScan.original_image_path)!} alt="Original MRI" className="w-full h-full object-contain" />
                      ) : activeImageTab === "highlighted" && currentScan.highlighted_image_path ? (
                         <img src={getImageUrl(currentScan.highlighted_image_path)!} alt="Highlighted MRI" className="w-full h-full object-contain" />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-black flex items-center justify-center">
                          <p className="text-white/30 font-mono">Image Not Available</p>
                        </div>
                      )}
                      
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <button className="p-2 rounded-lg bg-black/50 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center p-1 rounded-full bg-black/50 backdrop-blur border border-white/10">
                        {(["original", "highlighted"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveImageTab(tab)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                              activeImageTab === tab ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Right Column: AI Diagnosis Panel */}
                  <SpotlightCard className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 text-lg font-medium">
                      <Brain className="w-5 h-5 text-blue-400" />
                      AI Diagnosis
                    </h3>
                    <button 
                      onClick={handleExportReport}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-xs font-medium"
                    >
                      <Download className="w-4 h-4" /> Export Report
                    </button>
                  </div>
                  
                  <div className="space-y-6 flex-grow">
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

                    {/* Clinical Note — shows when ai_summary has a mismatch warning */}
                    {currentScan.ai_summary && currentScan.ai_summary.includes("CLINICAL NOTE") && (
                      <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-amber-400 mb-1">Clinical Discrepancy</p>
                            <p className="text-xs text-white/60 leading-relaxed">
                              {(() => {
                                const idx = currentScan.ai_summary!.indexOf("CLINICAL NOTE:");
                                if (idx === -1) return 'Type mismatch detected with patient history.';
                                const note = currentScan.ai_summary!.slice(idx + 15).trim();
                                const sentences = note.split('.').slice(0, 2).join('.') + '.';
                                return sentences;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  </SpotlightCard>
                </div>
                
                {/* Full Width: Medical Summary */}
                <SpotlightCard className="p-6">
                   <h3 className="text-lg font-medium mb-4 text-white/90">Medical Summary</h3>
                   <p className="text-base text-justify text-white/60 leading-relaxed whitespace-pre-wrap">
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
            ) : (
              <div className="text-center py-10 text-white/50">Please select a scan from the Overview tab.</div>
            )
          )}

          {activeMainTab === "compare" && (
            <SpotlightCard className="p-6">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Compare Scans</h3>
                  <div className="flex items-center gap-4">
                    <select 
                      value={compareScan1Id} 
                      onChange={e => setCompareScan1Id(Number(e.target.value) || "")}
                      className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="">Select Scan 1</option>
                      {scans.map(s => <option key={s.id} value={s.id}>{s.scan_uid} - {new Date(s.uploaded_at).toLocaleDateString()}</option>)}
                    </select>
                    <span className="text-white/50">vs</span>
                    <select 
                      value={compareScan2Id} 
                      onChange={e => setCompareScan2Id(Number(e.target.value) || "")}
                      className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="">Select Scan 2</option>
                      {scans.map(s => <option key={s.id} value={s.id}>{s.scan_uid} - {new Date(s.uploaded_at).toLocaleDateString()}</option>)}
                    </select>
                    <button 
                      onClick={handleCompare}
                      disabled={!compareScan1Id || !compareScan2Id || isComparing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      {isComparing ? 'Comparing...' : 'Run Comparison'}
                    </button>
                  </div>
                </div>

                {compareScan1Id && compareScan2Id && (() => {
                  const s1 = scans.find(s => s.id === compareScan1Id);
                  const s2 = scans.find(s => s.id === compareScan2Id);
                  return (
                  <div className="grid grid-cols-2 gap-6">
                    {[{ scan: s1, label: "Scan 1" }, { scan: s2, label: "Scan 2" }].map(({ scan, label }) => (
                      <div key={label} className="space-y-3">
                        <span className="font-medium text-white/80">{label}: {scan?.scan_uid || "—"}</span>
                        <div className="aspect-[4/3] bg-black rounded-xl border border-white/10 overflow-hidden relative">
                          {scan?.highlighted_image_path ? (
                            <img src={getImageUrl(scan.highlighted_image_path)!} className="w-full h-full object-contain" alt={label} />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/30 font-mono text-sm">Image Not Available</div>
                          )}
                        </div>
                        {/* Scan metadata card */}
                        {scan && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                              <p className="text-white/40 mb-0.5">Type</p>
                              <p className="font-medium text-white/80">{scan.tumor_type || "Unknown"}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                              <p className="text-white/40 mb-0.5">Probability</p>
                              <p className="font-medium text-white/80">{scan.probability ? `${(scan.probability * 100).toFixed(0)}%` : "N/A"}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                              <p className="text-white/40 mb-0.5">Severity</p>
                              <p className="font-medium text-yellow-400/80">{scan.severity || "—"}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                              <p className="text-white/40 mb-0.5">Location</p>
                              <p className="font-medium text-white/80">{scan.tumor_location || "—"}</p>
                            </div>
                            <div className="col-span-2 p-2 rounded-lg bg-white/5 border border-white/5">
                              <p className="text-white/40 mb-0.5">Uploaded</p>
                              <p className="font-medium text-white/60">{new Date(scan.uploaded_at).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  );
                })()}

                {/* Comparison Results */}
                {compareResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 mt-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-blue-400 flex items-center gap-2">
                        <Brain className="w-5 h-5" /> Progression Analysis
                      </h4>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium capitalize">
                          Status: {compareResult.comparison_result}
                        </span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium",
                          compareResult.growth_percentage > 0 ? "bg-red-500/20 text-red-400" : 
                          compareResult.growth_percentage < 0 ? "bg-green-500/20 text-green-400" : 
                          "bg-white/10 text-white/80"
                        )}>
                          Growth: {compareResult.growth_percentage > 0 ? '+' : ''}{compareResult.growth_percentage}%
                        </span>
                      </div>
                    </div>
                    <p className="text-white/80 leading-relaxed text-sm">
                      {compareResult.progression_summary}
                    </p>
                    <div className="pt-4 mt-2 border-t border-blue-500/20 flex justify-end">
                      <button 
                        onClick={handleExportComparisonReport}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Download Comparison Report
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </SpotlightCard>
          )}

          {activeMainTab === "reports" && (
            <SpotlightCard className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Generated Reports</h3>
              <p className="text-white/50 mb-6">Download and view medical reports for {patient.name}.</p>
              
              {scans && scans.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {scans.map(scan => (
                    <div key={scan.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white/90">{scan.scan_uid} Report</p>
                          <p className="text-xs text-white/50">{new Date(scan.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            const response = await api.get(`/report/pdf/${scan.id}`, {
                              responseType: "blob",
                            });
                            const blob = new Blob([response.data], { type: "application/pdf" });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `report_scan_${scan.id}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch {
                            alert("Failed to download report");
                          }
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-white/50">No reports available.</div>
              )}
            </SpotlightCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
