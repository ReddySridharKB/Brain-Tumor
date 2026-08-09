"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { UploadCloud, File, X, CheckCircle2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScanStore } from "@/store/useScanStore";

export default function UploadPage() {
  const router = useRouter();
  const { uploadScan, uploadStatus, resetUploadState } = useScanStore();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

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
      // Using a hardcoded patient ID 1 for now
      const scan = await uploadScan(1, file);
      
      // Navigate to the analysis page after showing complete status
      setTimeout(() => {
        router.push(`/analysis/${scan.id}`);
        resetUploadState();
      }, 1500);
      
    } catch (err) {
      console.error("Failed to upload scan", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight glow-text">Upload MRI Scan</h1>
        <p className="text-white/60">Securely upload patient MRI for AI-powered tumor analysis</p>
      </div>

      <SpotlightCard className="p-1">
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
                  <p className="text-sm text-white/50 mt-2">Please do not close this window</p>
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
                  <p className="text-sm text-white/50 mt-2">Redirecting to results...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
