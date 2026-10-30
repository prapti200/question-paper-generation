import React from 'react';
import { 
  X, 
  HelpCircle, 
  School, 
  Sun, 
  Sparkles, 
  Edit3, 
  Printer, 
  Download, 
  CheckCircle2,
  FileText,
  ShieldCheck
} from 'lucide-react';

export default function UserGuideModal({ isOpen, onClose, onOpenSchoolSettings }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                How to Use QuestAI Studio
              </h3>
              <p className="text-xs text-slate-400">
                Quick 4-step guide to generating & customizing perfect examination papers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guide Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          
          {/* Item 1: School Name */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
              <School className="w-4 h-4 text-indigo-400" />
              <span>1. Your Choice of School Name & Branding</span>
            </div>
            <p className="text-slate-300">
              <strong>It depends 100% on you which school name you give!</strong> You can enter any school, college, academy, or coaching institute name. It will be printed on the official header and security watermark of the question paper.
            </p>
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSchoolSettings();
                }}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition"
              >
                Set School Name Now ✏️
              </button>
            </div>
          </div>

          {/* Item 2: Theme Adjustment */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>2. Bright & Dark Theme Adjustment</span>
            </div>
            <p className="text-slate-300">
              Switch anytime between <strong>Bright Theme</strong> (clean, high-contrast light mode perfect for classroom presentations and daytime printing) and <strong>Dark Theme</strong> (sleek dark mode) using the top navigation button.
            </p>
          </div>

          {/* Item 3: Paper Generation */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>3. Smart AI Question Paper Generation</span>
            </div>
            <p className="text-slate-300">
              Choose <strong>Mode 1 (AI Topic & Syllabus)</strong> to specify subject, class, chapters, and question distribution (MCQs, Short Answer, Long Answer), or <strong>Mode 2 (PDF Multimodal)</strong> to extract questions directly from selected textbook pages.
            </p>
          </div>

          {/* Item 4: Edit, Preview & Export */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-violet-300">
              <Printer className="w-4 h-4 text-violet-400" />
              <span>4. Edit, Preview & 1-Click PDF Export</span>
            </div>
            <p className="text-slate-300">
              Review questions in <strong>Tab 2 (Edit)</strong> to customize marks or wording. Then open <strong>Tab 3 (Preview)</strong> to see the exact A4 printable paper with your school emblem and watermark. Click <strong>Print</strong> or <strong>Export PDF</strong> for ready-to-distribute exam sheets!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            QuestAI Studio • Examination Builder
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
          >
            Got it, Let's Build!
          </button>
        </div>

      </div>
    </div>
  );
}
