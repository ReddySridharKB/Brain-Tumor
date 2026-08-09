"use client";

import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { FileText, Download, Calendar, ArrowRight } from "lucide-react";

export default function ReportsPage() {
  const reports = [
    { id: "REP-001", patient: "P-4921", date: "2026-05-08", type: "Full Analysis", status: "Ready" },
    { id: "REP-002", patient: "P-8832", date: "2026-05-07", type: "Progression Summary", status: "Ready" },
    { id: "REP-003", patient: "P-1029", date: "2026-05-05", type: "Initial Assessment", status: "Ready" },
    { id: "REP-004", patient: "P-3341", date: "2026-05-01", type: "Full Analysis", status: "Ready" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight glow-text">Medical Reports</h1>
          <p className="text-white/60 mt-1">Exported AI analysis and clinical summaries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, i) => (
          <motion.div 
            key={report.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <SpotlightCard className="p-6 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  {report.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-medium text-white">{report.type}</h3>
                <p className="text-sm text-white/60 flex items-center gap-2">
                  Patient: <span className="text-white/80">{report.patient}</span>
                </p>
                <p className="text-sm text-white/60 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {report.date}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <button className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button className="flex-1 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                  View <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
