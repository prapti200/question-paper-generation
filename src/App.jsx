import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GeneratorForm from './components/GeneratorForm';
import PaperEditor from './components/PaperEditor';
import PaperPreview from './components/PaperPreview';
import AnswerKeyView from './components/AnswerKeyView';
import HeaderSettingsModal from './components/HeaderSettingsModal';
import ApiKeyModal from './components/ApiKeyModal';
import ExportModal from './components/ExportModal';
import UserGuideModal from './components/UserGuideModal';
import { 
  DEFAULT_HEADER_CONFIG, 
  INITIAL_SAMPLE_PAPER, 
  PRESET_TEMPLATES 
} from './data/samplePapers';
import { triggerBrowserPrint, downloadElementAsPdf } from './utils/exportUtils';
import { fetchApiConfig } from './utils/backendApi';
import { 
  Sparkles, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  FileCheck, 
  Layers, 
  Settings, 
  Printer, 
  Download,
  School,
  Sun,
  Moon,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const [headerConfig, setHeaderConfig] = useState(DEFAULT_HEADER_CONFIG);
  const [paper, setPaper] = useState(INITIAL_SAMPLE_PAPER);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'editor' | 'preview' | 'answers'

  // Bright / Dark Theme state (Persisted in localStorage)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('quest_theme') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('quest_theme', nextTheme);
    showToast(nextTheme === 'light' ? '☀️ Switched to Bright Theme' : '🌙 Switched to Dark Theme');
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  // Modals state
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);

  // Gemini API Key state (backed by .env on server)
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  // Check if server already has GEMINI_API_KEY in .env
  useEffect(() => {
    fetchApiConfig().then((cfg) => {
      if (cfg && cfg.hasApiKey) {
        setApiKey('CONFIGURED_IN_ENV');
      }
      if (cfg && cfg.scanModel) {
        setSelectedModel(cfg.scanModel);
      }
    });
  }, []);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Calculate total marks across paper
  const totalCalculatedMarks = paper.sections.reduce(
    (sum, sec) => sum + sec.questions.reduce((qSum, q) => qSum + (Number(q.marks) || 0), 0),
    0
  );

  // Calculate total question count
  const totalQuestionCount = paper.sections.reduce(
    (sum, sec) => sum + sec.questions.length,
    0
  );

  // When AI generates a fresh paper
  const handlePaperGenerated = (aiResult) => {
    if (!aiResult || !aiResult.sections) return;

    // Merge AI result with existing paper structure
    const updatedPaper = {
      header: {
        ...headerConfig,
        examTitle: aiResult.examTitle || headerConfig.examTitle,
        subject: aiResult.subject || headerConfig.subject,
        grade: aiResult.grade || headerConfig.grade,
        duration: aiResult.duration || headerConfig.duration,
        instructions: aiResult.instructions?.length > 0 ? aiResult.instructions : headerConfig.instructions,
      },
      sections: aiResult.sections,
    };

    setPaper(updatedPaper);
    setHeaderConfig(updatedPaper.header);

    // Switch view to Paper Preview
    setActiveTab('preview');
    showToast('✨ New Question Paper & Marking Scheme generated successfully!');
  };

  // Preset sample loader
  const handleLoadPreset = (preset) => {
    if (preset.presetPaper) {
      setPaper(preset.presetPaper);
      setHeaderConfig(preset.presetPaper.header);
    } else {
      setHeaderConfig((prev) => ({
        ...prev,
        subject: preset.subject,
        grade: preset.grade,
        duration: preset.duration,
        maxMarks: preset.marks,
      }));
    }
    showToast(`Loaded template: ${preset.name}`);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'light' ? 'theme-light bg-slate-50 text-slate-900' : 'theme-dark bg-slate-950 text-slate-100'
    }`}>
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHeaderSettings={() => setIsHeaderModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        apiKey={apiKey}
        totalMarks={totalCalculatedMarks}
        questionCount={totalQuestionCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        schoolName={headerConfig.schoolName}
      />



      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-indigo-900/90 text-white border border-indigo-500/50 shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto px-2 sm:px-3 py-1.5 ${
        activeTab === 'generate' ? 'max-w-[1920px]' : 'max-w-7xl'
      }`}>
        
        {/* TAB 1: GENERATOR & FEEDS */}
        {activeTab === 'generate' && (
          <GeneratorForm
            headerConfig={headerConfig}
            setHeaderConfig={setHeaderConfig}
            onPaperGenerated={handlePaperGenerated}
            apiKey={apiKey}
            selectedModel={selectedModel}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            paper={paper}
            setPaper={setPaper}
            onSwitchTab={setActiveTab}
            showToast={showToast}
          />
        )}

        {/* TAB 2: INTERACTIVE QUESTIONS EDITOR */}
        {activeTab === 'editor' && (
          <PaperEditor
            paper={paper}
            setPaper={setPaper}
            onOpenPreview={() => setActiveTab('preview')}
          />
        )}

        {/* TAB 3: A4 PAPER PREVIEW & PRINT */}
        {activeTab === 'preview' && (
          <PaperPreview
            paper={paper}
            headerConfig={headerConfig}
            onOpenHeaderSettings={() => setIsHeaderModalOpen(true)}
            onOpenEditor={() => setActiveTab('editor')}
            onPrint={() => triggerBrowserPrint()}
            onDownloadPdf={() => downloadElementAsPdf('printable-question-paper', `${headerConfig.subject || 'Question_Paper'}_Exam.pdf`)}
          />
        )}

        {/* TAB 4: TEACHER'S MARKING SCHEME & ANSWERS */}
        {activeTab === 'answers' && (
          <AnswerKeyView
            paper={paper}
            headerConfig={headerConfig}
            onPrintAnswerKey={() => triggerBrowserPrint()}
            onDownloadAnswerKeyPdf={() => downloadElementAsPdf('printable-answer-key', `${headerConfig.subject || 'Answer_Key'}_Solutions.pdf`)}
          />
        )}

      </main>

      {/* Modals */}
      <HeaderSettingsModal
        isOpen={isHeaderModalOpen}
        onClose={() => setIsHeaderModalOpen(false)}
        headerConfig={headerConfig}
        setHeaderConfig={setHeaderConfig}
        calculatedTotalMarks={totalCalculatedMarks}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        paper={paper}
        headerConfig={headerConfig}
        onSwitchTab={(tab) => setActiveTab(tab)}
      />

      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
        onOpenSchoolSettings={() => setIsHeaderModalOpen(true)}
      />

    </div>
  );
}
