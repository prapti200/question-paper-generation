import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  FileSpreadsheet, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { triggerBrowserPrint, downloadElementAsPdf, exportPaperAsText } from '../utils/exportUtils';

export default function ExportModal({
  isOpen,
  onClose,
  paper,
  headerConfig,
  onSwitchTab,
}) {
  const [downloadingPaper, setDownloadingPaper] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState(false);

  if (!isOpen) return null;

  const handlePrintPaper = () => {
    onSwitchTab('preview');
    onClose();
    setTimeout(() => {
      triggerBrowserPrint();
    }, 300);
  };

  const handlePrintKey = () => {
    onSwitchTab('answers');
    onClose();
    setTimeout(() => {
      triggerBrowserPrint();
    }, 300);
  };

  const handleDownloadPaperPdf = async () => {
    onSwitchTab('preview');
    setDownloadingPaper(true);
    try {
      // Ensure preview is visible in DOM
      await new Promise((r) => setTimeout(r, 400));
      const filename = `${headerConfig.subject || 'Question_Paper'}_${headerConfig.grade || 'Exam'}.pdf`.replace(/\s+/g, '_');
      await downloadElementAsPdf('printable-question-paper', filename);
      onClose();
    } catch (err) {
      alert(`Could not download PDF: ${err.message}`);
    } finally {
      setDownloadingPaper(false);
    }
  };

  const handleDownloadKeyPdf = async () => {
    onSwitchTab('answers');
    setDownloadingKey(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const filename = `${headerConfig.subject || 'Answer_Key'}_Marking_Scheme.pdf`.replace(/\s+/g, '_');
      await downloadElementAsPdf('printable-answer-key', filename);
      onClose();
    } catch (err) {
      alert(`Could not download Answer Key PDF: ${err.message}`);
    } finally {
      setDownloadingKey(false);
    }
  };

  const handleExportText = () => {
    exportPaperAsText(paper, headerConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export & Print Examination Papers</h2>
              <p className="text-xs text-slate-400">Download formatted PDFs or print directly to A4 sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-5">
          
          {/* Section 1: Question Paper Exports */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
              1. Student Question Paper
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePrintPaper}
                className="flex items-center gap-3 p-3.5 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition group"
              >
                <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block group-hover:text-indigo-300">
                    Direct Browser Print
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Zero margins, A4 vector print
                  </span>
                </div>
              </button>

              <button
                type="button"
                disabled={downloadingPaper}
                onClick={handleDownloadPaperPdf}
                className="flex items-center gap-3 p-3.5 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition group"
              >
                <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                  {downloadingPaper ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block group-hover:text-indigo-300">
                    Download as PDF
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Ready-to-distribute PDF file
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Teacher's Marking Scheme */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              2. Teacher's Evaluation & Marking Scheme
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePrintKey}
                className="flex items-center gap-3 p-3.5 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition group"
              >
                <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block group-hover:text-emerald-300">
                    Print Marking Scheme
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Full solutions & rubric sheet
                  </span>
                </div>
              </button>

              <button
                type="button"
                disabled={downloadingKey}
                onClick={handleDownloadKeyPdf}
                className="flex items-center gap-3 p-3.5 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition group"
              >
                <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                  {downloadingKey ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block group-hover:text-emerald-300">
                    Download Key PDF
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Complete solution document
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Word / Text Export */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleExportText}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">
                    Export for Microsoft Word & Docs (.txt format)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Formatted text copy for Word, Google Docs or offline archiving
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
