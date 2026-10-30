import React from 'react';
import { 
  FileText, 
  Sparkles, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  Settings, 
  Key, 
  Printer, 
  Download, 
  BookOpen, 
  Layers,
  Sun,
  Moon,
  School,
  HelpCircle
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenHeaderSettings,
  onOpenApiKeyModal,
  onOpenExportModal,
  onLoadPreset,
  apiKey,
  totalMarks,
  questionCount,
  theme,
  onToggleTheme,
  schoolName,
  onOpenUserGuide,
}) {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-white/95 border-b border-slate-200/90 text-slate-900 shadow-sm'
        : 'bg-slate-900/90 border-b border-slate-800 text-slate-100 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-lg tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent'
                }`}>
                  QuestAI Studio
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Paper Generator
                </span>
              </div>
              <p className={`text-xs hidden lg:block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Custom School Exam Paper & Question Builder
              </p>
            </div>
          </div>

          {/* Current School Name Quick Indicator */}
          <div className="hidden xl:flex items-center">
            <button
              type="button"
              onClick={onOpenHeaderSettings}
              title="Click to customize School / College / Institution Name"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition group ${
                theme === 'light'
                  ? 'bg-indigo-50/70 hover:bg-indigo-100/70 border-indigo-200 text-indigo-800'
                  : 'bg-indigo-950/40 hover:bg-indigo-950/70 border-indigo-500/40 text-indigo-200'
              }`}
            >
              <School className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className={`text-[10px] uppercase font-semibold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-300'}`}>Active School:</div>
                <div className={`font-bold text-xs truncate max-w-[170px] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {schoolName || 'Set School Name'}
                </div>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ml-1 ${theme === 'light' ? 'bg-indigo-200/60 text-indigo-800' : 'bg-indigo-500/30 text-indigo-200'}`}>
                Edit ✏️
              </span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className={`flex items-center gap-1 p-1 rounded-xl border shadow-inner ${
            theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'generate'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. Generate</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>2. Edit</span>
              <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                theme === 'light' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-indigo-950/60 text-indigo-200 border border-indigo-400/20'
              }`}>
                {questionCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3. Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('answers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'answers'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Marking Scheme</span>
              <span className="sm:hidden">Answers</span>
            </button>
          </nav>

          {/* Controls & Modals */}
          <div className="flex items-center gap-2">
            
            {/* BRIGHT / DARK THEME TOGGLE BUTTON */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? "Switch to Bright (Light) Theme" : "Switch to Dark Theme"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all transform hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300 shadow-md shadow-indigo-500/10'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Bright Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Dark Theme</span>
                </>
              )}
            </button>

            {/* Quick User Guide Button */}
            <button
              type="button"
              onClick={onOpenUserGuide}
              title="How to use QuestAI Studio (Guide)"
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Guide</span>
            </button>

            {/* Header / Watermark Settings */}
            <button
              onClick={onOpenHeaderSettings}
              title="Configure School Name, Logo & Watermark"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <School className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">School & Header</span>
            </button>

            {/* API Key Modal Button */}
            <button
              onClick={onOpenApiKeyModal}
              title={apiKey ? 'Gemini API Connected' : 'Set Gemini API Key'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                apiKey
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{apiKey ? 'API Active' : 'API Key'}</span>
            </button>

            {/* Export & Print */}
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
