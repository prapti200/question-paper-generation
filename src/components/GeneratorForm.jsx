import React, { useState, useRef, useId, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Target, 
  Download, 
  Printer, 
  Edit3, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Info, 
  X, 
  Sparkles, 
  ExternalLink,
  BookOpen,
  GraduationCap,
  School,
  Sliders,
  Check,
  Award,
  Layers,
  HelpCircle,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  BookMarked
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { extractPdfDocument, extractDiagramFromPageCanvas } from '../utils/pdfExtractor';
import { analyzeDocumentConcepts } from '../utils/documentConceptAnalyzer';
import { generateRealtimePaper, generateTopicPaper, generatePdfGroundedPaper } from '../utils/realtimePaperGenerator';
import { triggerBrowserPrint, downloadElementAsPdf, downloadPaperAsWord } from '../utils/exportUtils';
import { scanPdfMultimodal, extractImagesFromPdfFile, generatePaperFromModel } from '../utils/backendApi';
import { cropAndSaveAllFigures } from '../utils/diagramCropper';
import McqGeneratorStudio from './McqGeneratorStudio';
import DiagramWithPointers from './DiagramWithPointers';

const PRESET_MARKS = [
  { marks: 25, label: '25 Marks (Unit Test)' },
  { marks: 50, label: '50 Marks (Mid-Term)' },
  { marks: 80, label: '80 Marks (Board Exam)' },
  { marks: 100, label: '100 Marks (Annual Exam)' }
];

const PRESET_GRADES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const PRESET_DURATIONS = ['1 Hour', '1.5 Hours', '2 Hours', '3 Hours'];

const POPULAR_TEMPLATES = [
  { name: 'Class 10 Science (80 Marks)', subject: 'Science (Physics & Chemistry)', grade: 'Class 10', marks: 80, duration: '3 Hours', topic: 'Light Reflection, Chemical Reactions & Life Processes' },
  { name: 'Class 12 Physics (70 Marks)', subject: 'Physics', grade: 'Class 12', marks: 70, duration: '3 Hours', topic: 'Electrostatics, Optics & Modern Physics' },
  { name: 'Class 10 Mathematics (80 Marks)', subject: 'Mathematics', grade: 'Class 10', marks: 80, duration: '3 Hours', topic: 'Algebra, Trigonometry & Geometry' },
  { name: 'Class 9 Biology (50 Marks)', subject: 'Biology', grade: 'Class 9', marks: 50, duration: '2 Hours', topic: 'Cell - The Fundamental Unit of Life & Tissues' },
];

export default function GeneratorForm({
  headerConfig,
  setHeaderConfig,
  onPaperGenerated,
  apiKey,
  selectedModel,
  onOpenApiKeyModal,
  paper,
  setPaper,
  onSwitchTab,
  showToast,
}) {
  // ─────────────────────────────────────────────────────────────
  // ONLY TWO OPTIONS STATE:
  // null = Landing screen with ONLY two option buttons displayed
  // 'mcq' = Option 1: Generate MCQ Base Test
  // 'paper' = Option 2: Generate Question Paper Using PDF
  // ─────────────────────────────────────────────────────────────
  const [activeOption, setActiveOption] = useState(null);
  const [hoveredOption, setHoveredOption] = useState(null); // 'mcq' | 'paper' | null

  // File upload state for Option 2
  const [selectedFile, setSelectedFile] = useState(null);
  const [docState, setDocState] = useState({
    loaded: false,
    filename: '',
    fileSize: '',
    totalPages: 0,
    pages: [],
    chapters: [],
    topics: [],
    figures: [],
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Blueprint / Target ceiling settings
  const [targetMarks, setTargetMarks] = useState(headerConfig.maxMarks || 80);
  const [targetGrade, setTargetGrade] = useState(headerConfig.grade || 'Class 10');
  const [targetDuration, setTargetDuration] = useState(headerConfig.duration || '3 Hours');
  const [targetBoard, setTargetBoard] = useState(headerConfig.board || 'CBSE');
  const [customBoardName, setCustomBoardName] = useState('');
  const [customSubject, setCustomSubject] = useState(headerConfig.subject || 'General Science');
  const [customTopic, setCustomTopic] = useState('');

  const effectiveTargetBoard = targetBoard === 'Other'
    ? (customBoardName.trim() || 'Other Board')
    : targetBoard;

  // Question sections checklist
  const [questionTypes, setQuestionTypes] = useState({
    mcq: true,
    fillBlanks: true,
    shortAnswer: true,
    longAnswer: true,
    diagram: true,
  });

  // State for paper generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTeacherSolutions, setShowTeacherSolutions] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const fileInputRef = useRef(null);
  const fileInputId = useId();

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return Math.round(bytes / 1024) + ' KB';
  };

  // Handle file selection
  const handleFile = async (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      if (showToast) showToast('⚠️ Please upload a valid PDF document or syllabus.');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress('Extracting & rendering PDF pages at 150 DPI...');

    try {
      const extracted = await extractPdfDocument(file, ({ current, total }) => {
        setUploadProgress(`Rendering page ${current} of ${total} at 150 DPI...`);
      });

      const conceptResult = analyzeDocumentConcepts(extracted.pages || []);
      const chapters = conceptResult.chapters || [];
      const topics = conceptResult.topics || [];
      
      // 1. Direct PyMuPDF extraction of all authentic embedded diagrams & images
      let figures = [];
      try {
        setUploadProgress('Extracting all embedded diagrams & figures with PyMuPDF...');
        const pymupdfFigures = await extractImagesFromPdfFile(file);
        if (pymupdfFigures && pymupdfFigures.length > 0) {
          figures = pymupdfFigures;
        }
      } catch (pmErr) {
        console.warn('PyMuPDF extraction notice:', pmErr.message);
      }

      // 2. Multimodal AI Vision Scan if needed
      if (!figures || figures.length === 0) {
        try {
          setUploadProgress('Detecting & cropping science diagrams with AI Vision...');
          const scanRes = await scanPdfMultimodal({
            pdfHash: extracted.pdfHash,
            pages: extracted.pages,
          });
          if (scanRes && scanRes.figures && scanRes.figures.length > 0) {
            figures = await cropAndSaveAllFigures(scanRes.figures, extracted.pages);
          }
        } catch (scanErr) {
          console.warn('AI vision scan notice:', scanErr.message);
        }
      }

      // Local fallback: crop diagrams directly from rendered page canvases
      if (!figures || figures.length === 0) {
        for (const page of (extracted.pages || [])) {
          if (page.dataUrl && page.dataUrl.length > 200) {
            const hasFig = /(?:fig(?:ure)?\.?|diagram|illustration|चित्र|आकृति)/i.test(page.text || '') || page.isImageOnly;
            if (hasFig || figures.length < 4) {
              try {
                const croppedUrl = await extractDiagramFromPageCanvas(page.dataUrl);
                figures.push({
                  id: `fig_p${page.pageNumber}_${Date.now()}`,
                  page: page.pageNumber,
                  caption: `Figure from Page ${page.pageNumber}`,
                  imageUrl: croppedUrl,
                  dataUrl: croppedUrl,
                  labels_present: ['Part [A]', 'Part [B]', 'Part [C]', 'Part [D]'],
                });
                if (figures.length >= 8) break;
              } catch (cropErr) {
                console.warn(cropErr);
              }
            }
          }
        }
      }

      const newDocState = {
        loaded: true,
        filename: file.name,
        fileSize: formatFileSize(file.size),
        totalPages: extracted.totalPages || extracted.pages?.length || 1,
        pages: extracted.pages || [],
        chapters: chapters || [],
        topics: topics || [],
        figures: figures || [],
        detectedFromIndex: conceptResult.detectedFromIndex || false,
      };

      setDocState(newDocState);
      if (showToast) {
        if (conceptResult.detectedFromIndex) {
          showToast(`✓ Extracted ${chapters.length} Real Chapters & ${topics.length} Topics (Matched from Textbook Index)!`);
        } else {
          showToast(`✓ Successfully processed ${file.name} (${newDocState.totalPages} Pages)!`);
        }
      }

      if (file.name.toLowerCase().includes('science')) setCustomSubject('Science');
      else if (file.name.toLowerCase().includes('math')) setCustomSubject('Mathematics');
      else if (file.name.toLowerCase().includes('physics')) setCustomSubject('Physics');
      else if (file.name.toLowerCase().includes('chem')) setCustomSubject('Chemistry');
      else if (file.name.toLowerCase().includes('bio')) setCustomSubject('Biology');
    } catch (err) {
      console.error('File parsing error:', err);
      if (showToast) showToast(`⚠️ PDF Parse Warning: ${err.message || 'Used instant local engine'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setDocState({
      loaded: false,
      filename: '',
      fileSize: '',
      totalPages: 0,
      pages: [],
      chapters: [],
      topics: [],
      figures: [],
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleQuestionType = (key) => {
    setQuestionTypes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Generate Question Paper with Multimodal AI
  const handleGenerate = async () => {
    setIsGenerating(true);
    if (showToast) showToast(`⚡ Generating ${targetMarks} Marks Question Paper with Multimodal AI...`);

    try {
      let generatedResult;

      if (docState.loaded && docState.pages.length > 0) {
        const allTopicIds = new Set(docState.topics.map(t => t.id));
        const allPageNumbers = new Set(docState.pages.map(p => p.pageNumber));
        const effectiveFigures = docState.figures || [];

        const questionSettings = {
          mcq: { enabled: questionTypes.mcq, count: Math.max(2, Math.round(targetMarks * 0.2)), marks: 1 },
          fill_in_the_blanks: { enabled: questionTypes.fillBlanks, count: Math.max(2, Math.round(targetMarks * 0.1)), marks: 1 },
          short_answer: { enabled: questionTypes.shortAnswer, count: Math.max(2, Math.round(targetMarks * 0.25)), marks: 2 },
          long_answer: { enabled: questionTypes.longAnswer, count: Math.max(1, Math.round(targetMarks * 0.25)), marks: 5 },
          diagram_based: { enabled: questionTypes.diagram, count: 1, marks: 4 },
          label_the_diagram: { enabled: questionTypes.diagram, count: 1, marks: 4 },
        };

        const currentHeader = {
          ...headerConfig,
          subject: customSubject,
          grade: targetGrade,
          duration: targetDuration,
          board: effectiveTargetBoard,
          affiliation: `${effectiveTargetBoard} Curriculum Assessment`,
          maxMarks: targetMarks,
        };

        // 1. Try Gemini Multimodal Cloud AI
        try {
          const aiRes = await generatePaperFromModel({
            selectedTopics: docState.topics || [],
            selectedPages: docState.pages || [],
            questionSettings,
            figures: effectiveFigures,
            headerConfig: currentHeader,
          });

          if (aiRes && aiRes.paper && aiRes.paper.sections && aiRes.paper.sections.length > 0) {
            generatedResult = aiRes.paper;
          }
        } catch (aiErr) {
          console.warn('Multimodal AI generation fallback:', aiErr.message);
        }

        // 2. Fallback to local grounded generator if API call didn't return paper
        if (!generatedResult) {
          generatedResult = generatePdfGroundedPaper({
            docState,
            selectedTopicIds: allTopicIds,
            selectedPagesFromTopics: allPageNumbers,
            questionSettings,
            headerConfig: currentHeader,
            figures: effectiveFigures,
          });
        }
      } else {
        const activeTopic = customTopic.trim() || 'Comprehensive Curriculum & Core Concepts';
        generatedResult = generateTopicPaper({
          topic: activeTopic,
          subject: customSubject,
          grade: targetGrade,
          questionTypes: {
            mcq: questionTypes.mcq,
            fillBlanks: questionTypes.fillBlanks,
            oneSentence: true,
            brief: questionTypes.shortAnswer,
            diagram: questionTypes.diagram,
            match: false,
          },
          headerConfig: {
            ...headerConfig,
            subject: customSubject,
            grade: targetGrade,
            duration: targetDuration,
            board: effectiveTargetBoard,
            affiliation: `${effectiveTargetBoard} Curriculum Assessment`,
            maxMarks: targetMarks,
          },
        });
      }

      if (generatedResult) {
        setPaper(generatedResult);
        if (onPaperGenerated) onPaperGenerated(generatedResult);
        setHeaderConfig(generatedResult.header || headerConfig);
        setHasGenerated(true);

        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });

        if (showToast) showToast('✨ Question Paper & Marking Scheme generated successfully!');
      }
    } catch (err) {
      console.error('Generation error:', err);
      if (showToast) showToast('Generated paper using standard board blueprint.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadTemplate = (tpl) => {
    setCustomSubject(tpl.subject);
    setTargetGrade(tpl.grade);
    setTargetMarks(tpl.marks);
    setTargetDuration(tpl.duration);
    setCustomTopic(tpl.topic);
    if (showToast) showToast(`✓ Loaded template: ${tpl.name}`);
  };

  const totalCalculatedMarks = paper?.sections?.reduce(
    (sum, sec) => sum + sec.questions.reduce((qSum, q) => qSum + (Number(q.marks) || 0), 0),
    0
  ) || targetMarks;

  const totalQuestionCount = paper?.sections?.reduce(
    (sum, sec) => sum + sec.questions.length,
    0
  ) || 28;

  // ─────────────────────────────────────────────────────────────
  // 1. INITIAL LANDING SCREEN: ONLY TWO BUTTONS (OPTIONS) ARE DISPLAYED
  // ─────────────────────────────────────────────────────────────
  // 1. INITIAL LANDING SCREEN: ONLY TWO BUTTONS (OPTIONS) ARE DISPLAYED
  // ─────────────────────────────────────────────────────────────
  if (activeOption === null) {
    return (
      <div className="min-h-[75vh] flex flex-col justify-center items-center py-10 px-4 animate-fade-in font-sans">
        
        {/* Header Tag & Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 via-indigo-100/70 to-violet-50 text-indigo-800 text-xs sm:text-sm font-extrabold tracking-wider uppercase shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Generate the Question Paper</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Choose What to Generate
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            Select what you would like to generate to start creating question papers or classroom tests:
          </p>
        </div>

        {/* ── THE TWO EXCLUSIVE BUTTONS / CARDS ALWAYS SIDE-BY-SIDE ── */}
        <div className="w-full max-w-5xl px-3 py-2 relative">
          
          {/* Strictly 2 Columns Side by Side */}
          <div 
            className="grid grid-cols-2 gap-6 sm:gap-8 md:gap-10 w-full"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
              gap: '2.5rem',
              alignItems: 'stretch'
            }}
          >
            
            {/* BUTTON 1: GENERATE MCQ BASED TEST */}
            <button
              type="button"
              onClick={() => setActiveOption('mcq')}
              onMouseEnter={() => setHoveredOption('mcq')}
              onMouseLeave={() => setHoveredOption(null)}
              onFocus={() => setHoveredOption('mcq')}
              onBlur={() => setHoveredOption(null)}
              style={{
                borderRadius: '32px',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
                border: hoveredOption === 'mcq' ? '2px solid #bfdbfe' : '2px solid transparent',
                outline: 'none',
                transform: hoveredOption === 'mcq' ? 'scale(1.02) translateY(-3px)' : 'scale(1)',
                opacity: 1,
                zIndex: hoveredOption === 'mcq' ? 10 : 1,
                boxShadow: hoveredOption === 'mcq'
                  ? '0 16px 36px -8px rgba(191, 219, 254, 0.5), 0 4px 14px -2px rgba(0, 0, 0, 0.03)'
                  : '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 4px 16px -2px rgba(226, 232, 240, 0.4)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="group text-left p-6 sm:p-8 md:p-10 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600" />

              <div className="space-y-5">
                
                {/* Badge Tag */}
                <div className="flex items-center justify-between">
                  <span 
                    style={{ borderRadius: '9999px' }}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider"
                  >
                    Instant MCQ Test
                  </span>
                  <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Quick Assessment</span>
                </div>

                {/* Curved Icon Badge */}
                <div 
                  style={{ borderRadius: '24px' }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform"
                >
                  <CheckSquare className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Generate MCQ Base Test
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    Create topic-specific multiple-choice question tests with randomized options, instant answer keys, and detailed teacher explanations.
                  </p>
                </div>

                {/* Quick Feature Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-700">⚡ 5-Second Generation</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-700">🎯 Instant Answer Key</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-700">🔀 4 Difficulty Levels</span>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-2 pt-3 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Type any curriculum topic (Science, Math, Social)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>5 to 50 MCQs with instant shuffle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>One-click copy, print, or export as full test paper</span>
                  </div>
                </div>

              </div>

              {/* Bottom Action CTA */}
              <div className="mt-7 pt-4 flex items-center justify-between font-bold text-sm text-indigo-700">
                <span>Start MCQ Generator</span>
                <div 
                  style={{ borderRadius: '9999px' }}
                  className="w-9 h-9 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 flex items-center justify-center transition-all shadow-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* BUTTON 2: GENERATE QUESTION PAPER USING PDF */}
            <button
              type="button"
              onClick={() => setActiveOption('paper')}
              onMouseEnter={() => setHoveredOption('paper')}
              onMouseLeave={() => setHoveredOption(null)}
              onFocus={() => setHoveredOption('paper')}
              onBlur={() => setHoveredOption(null)}
              style={{
                borderRadius: '32px',
                background: 'linear-gradient(180deg, #ffffff 0%, #f5fdf9 100%)',
                border: hoveredOption === 'paper' ? '2px solid #bfdbfe' : '2px solid transparent',
                outline: 'none',
                transform: hoveredOption === 'paper' ? 'scale(1.02) translateY(-3px)' : 'scale(1)',
                opacity: 1,
                zIndex: hoveredOption === 'paper' ? 10 : 1,
                boxShadow: hoveredOption === 'paper'
                  ? '0 16px 36px -8px rgba(191, 219, 254, 0.5), 0 4px 14px -2px rgba(0, 0, 0, 0.03)'
                  : '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 4px 16px -2px rgba(226, 232, 240, 0.4)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="group text-left p-6 sm:p-8 md:p-10 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />

              <div className="space-y-5">
                
                {/* Badge Tag */}
                <div className="flex items-center justify-between">
                  <span 
                    style={{ borderRadius: '9999px' }}
                    className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs uppercase tracking-wider"
                  >
                    Full Question Paper
                  </span>
                  <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Board Format</span>
                </div>

                {/* Curved Icon Badge */}
                <div 
                  style={{ borderRadius: '24px' }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform"
                >
                  <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Generate Question Paper Using PDF
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    Upload textbook chapters, syllabus notes, or past papers to generate comprehensive CBSE/Board question papers with blueprints & diagrams.
                  </p>
                </div>

                {/* Quick Feature Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-800">📄 150 DPI PDF Scanner</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-800">🖼️ Diagram Labelling</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-800">📊 25M-100M Blueprints</span>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-2 pt-3 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>In-browser PDF chapter & diagram extraction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>25M to 100M Target Marks Ceiling & Slider</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sections A to E, Diagram Labelling & A4 Print Layout</span>
                  </div>
                </div>

              </div>

              {/* Bottom Action CTA */}
              <div className="mt-7 pt-4 flex items-center justify-between font-bold text-sm text-emerald-700">
                <span>Upload PDF & Build Paper</span>
                <div 
                  style={{ borderRadius: '9999px' }}
                  className="w-9 h-9 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-700 flex items-center justify-center transition-all shadow-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* Supporting Trust & Standards Ribbon */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Instant AI Generation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>A4 Printable & PDF Export</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>CBSE, ICSE & State Board Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
            <span>100% In-Browser & Private</span>
          </div>
        </div>

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ACTIVE VIEW: TOOL BAR WITH "BACK TO OPTIONS" SWITCHER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 space-y-8 animate-fade-in font-sans">
      
      {/* Top Switcher Bar between Options with Curved Edges */}
      <div 
        className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-md p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3"
      >
        
        {/* Left: Back to the Main Selection Screen */}
        <button
          type="button"
          onClick={() => setActiveOption(null)}
          className="px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs transition flex items-center gap-2 cursor-pointer border-2 border-slate-200 hover:border-slate-300 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Options</span>
        </button>

        {/* Center: Active Tool Indicator & Switcher Tabs */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-100/90 p-1.5 rounded-2xl border-2 border-slate-200 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setActiveOption('mcq')}
            className={`px-4 py-2.5 rounded-2xl transition flex items-center gap-2 border-2 cursor-pointer ${
              activeOption === 'mcq'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Generate MCQ Base Test</span>
          </button>

          <span className="text-slate-300 font-black hidden sm:inline">•</span>

          <button
            type="button"
            onClick={() => setActiveOption('paper')}
            className={`px-4 py-2.5 rounded-2xl transition flex items-center gap-2 border-2 cursor-pointer ${
              activeOption === 'paper'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Generate Question Paper Using PDF</span>
          </button>
        </div>

        {/* Right: Quick Guide Note */}
        <div className="text-[11px] text-slate-600 font-bold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hidden lg:block">
          {activeOption === 'mcq'
            ? '🎯 Topic-Based MCQ Assessment Engine'
            : '📄 In-Browser PDF Chapter Examination Engine'}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* RENDER ACTIVE OPTION 1: MCQ GENERATOR STUDIO                */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeOption === 'mcq' && (
        <McqGeneratorStudio
          headerConfig={headerConfig}
          setPaper={setPaper}
          onSwitchTab={onSwitchTab}
          showToast={showToast}
          apiKey={apiKey}
          selectedModel={selectedModel}
          onOpenApiKeyModal={onOpenApiKeyModal}
        />
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* RENDER ACTIVE OPTION 2: QUESTION PAPER USING PDF (FILEZENITH) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeOption === 'paper' && (
        <div className="space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>PDF Examination Engine • 100% In-Browser & Private</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Generate Question Paper Using PDF
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Upload any syllabus, textbook PDF, or notes to create board-standard exam papers with target marks ceiling, diagrams, and automated marking schemes.
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* CARD 1: DROPZONE / PDF UPLOAD BOX */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                
                <input
                  type="file"
                  ref={fileInputRef}
                  id={fileInputId}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                        : 'border-emerald-200/90 bg-emerald-50/40 hover:bg-emerald-50/70 hover:border-emerald-400'
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                      <UploadCloud className="w-8 h-8" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      Drag & drop your syllabus, textbook, or notes PDF here
                    </h3>

                    <p className="text-xs text-slate-500 mb-6">
                      Supports PDF, scanned book chapters, blueprints & images (Max 100MB)
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 transition transform active:scale-95 text-sm"
                    >
                      <FileText className="w-4 h-4 text-emerald-200" />
                      <span>Browse Files from Device</span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                          {selectedFile.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-slate-600">
                            {formatFileSize(selectedFile.size)}
                          </span>
                          {docState.totalPages > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs font-semibold text-emerald-700">
                                {docState.totalPages} Pages Analyzed
                              </span>
                            </>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Ready</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-fade-in">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-xs font-semibold text-emerald-900">
                      {uploadProgress || 'Processing document with in-browser engine...'}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Or Enter Subject & Topic Directly:</span>
                    <span className="text-slate-400 font-normal">Optional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="e.g. Science, Physics, Chemistry, Math"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Chapter</label>
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="e.g. Light Reflection, Photosynthesis, Quadratic Equations"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* CARD 2: TARGET MARKS CEILING & BLUEPRINT */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Exam Blueprint & Target Marks Ceiling
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select the maximum allowed marks and examination structure
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                    {targetMarks} Marks
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Target Marks Presets:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PRESET_MARKS.map((preset) => (
                      <button
                        key={preset.marks}
                        type="button"
                        onClick={() => setTargetMarks(preset.marks)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                          targetMarks === preset.marks
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ceiling Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800">
                      Selected Blueprint: <strong className="text-emerald-700">{targetMarks} Marks</strong> • {targetGrade} • {targetDuration} • <strong className="text-emerald-800">{effectiveTargetBoard}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-700 uppercase">
                    {effectiveTargetBoard} Pattern
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Granular Marks Adjustment:</span>
                    <span className="font-bold text-emerald-600 text-sm">{targetMarks} Marks</span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={targetMarks}
                    onChange={(e) => setTargetMarks(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
                    <span>10M (Quiz)</span>
                    <span>25M (Unit Test)</span>
                    <span>50M (Mid-Term)</span>
                    <span className="font-bold text-emerald-600">80M (Recommended)</span>
                    <span>100M (Annual)</span>
                  </div>
                </div>

                {/* Grade, Duration & Board */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Class / Grade</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_GRADES.map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => setTargetGrade(grade)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                            targetGrade === grade
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Exam Duration</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_DURATIONS.map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setTargetDuration(dur)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                            targetDuration === dur
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Education Board Selection & Other Option */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Education Board:
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {['CBSE', 'ICSE / ISC', 'State Board', 'Cambridge / IGCSE', 'IB', 'Other'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setTargetBoard(b);
                          if (showToast && b !== 'Other') showToast(`✓ Selected Board: ${b}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                          targetBoard === b
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  {targetBoard === 'Other' && (
                    <input
                      type="text"
                      value={customBoardName}
                      onChange={(e) => setCustomBoardName(e.target.value)}
                      placeholder="Enter board name..."
                      className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-white border-2 border-emerald-500 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition shadow-xs"
                      autoFocus
                    />
                  )}
                </div>

                {/* Sections Checklist */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Include Question Types:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                      <input
                        type="checkbox"
                        checked={questionTypes.mcq}
                        onChange={() => toggleQuestionType('mcq')}
                        className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">Section A: MCQs</span>
                        <span className="text-[11px] text-slate-500 block">Multiple choice (1 Mark each)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                      <input
                        type="checkbox"
                        checked={questionTypes.fillBlanks}
                        onChange={() => toggleQuestionType('fillBlanks')}
                        className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">Section B: Fill in Blanks</span>
                        <span className="text-[11px] text-slate-500 block">One-line & Blanks (1 Mark each)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                      <input
                        type="checkbox"
                        checked={questionTypes.shortAnswer}
                        onChange={() => toggleQuestionType('shortAnswer')}
                        className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">Section C: Short Answers</span>
                        <span className="text-[11px] text-slate-500 block">Conceptual questions (2-3 Marks)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                      <input
                        type="checkbox"
                        checked={questionTypes.longAnswer}
                        onChange={() => toggleQuestionType('longAnswer')}
                        className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">Section D: Long Answers</span>
                        <span className="text-[11px] text-slate-500 block">Explanatory & numerical (5 Marks)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={questionTypes.diagram}
                        onChange={() => toggleQuestionType('diagram')}
                        className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">Section E: Diagram-Based Questions & Labelling</span>
                        <span className="text-[11px] text-slate-500 block">Scientific diagrams with numbered pointers & write-in blanks (4 Marks)</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Primary Button */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-emerald-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Examination Paper ({targetMarks} Marks)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>Generate Question Paper ({targetMarks} Marks)</span>
                    </>
                  )}
                </button>

              </div>

              {/* CARD 3: RESULTS & LIVE PREVIEW */}
              {(hasGenerated || (paper && paper.sections && paper.sections.length > 0)) && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                  
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950">
                          Question Paper Generated Successfully!
                        </h4>
                        <p className="text-xs text-emerald-800">
                          {totalCalculatedMarks} Marks • {totalQuestionCount} Questions • {paper.header?.duration || targetDuration}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setShowTeacherSolutions(!showTeacherSolutions)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          showTeacherSolutions
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {showTeacherSolutions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{showTeacherSolutions ? 'Marking Scheme ON' : 'Marking Scheme'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerBrowserPrint()}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print (A4)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadElementAsPdf('active-question-paper-preview', `${customSubject || 'Question_Paper'}_Exam.pdf`)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSwitchTab('editor')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Questions</span>
                      </button>
                    </div>
                  </div>

                  <div 
                    id="active-question-paper-preview"
                    className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-md font-serif text-slate-900 space-y-6"
                  >
                    <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
                        {paper.header?.schoolName || headerConfig.schoolName || 'DELHI PUBLIC SCHOOL'}
                      </h2>
                      <p className="text-xs uppercase font-sans text-slate-600 font-semibold">
                        {paper.header?.affiliation || headerConfig.affiliation || 'Senior Secondary Examination • CBSE Curriculum'}
                      </p>
                      <h3 className="text-base font-bold font-sans text-emerald-900 uppercase pt-1">
                        {paper.header?.examTitle || `ANNUAL EXAMINATION (${new Date().getFullYear()}-${new Date().getFullYear() + 1})`}
                      </h3>
                      
                      <div className="flex flex-wrap justify-between items-center text-xs font-sans font-bold pt-2 border-t border-slate-200 text-slate-800">
                        <span>SUBJECT: {(paper.header?.subject || customSubject).toUpperCase()}</span>
                        <span>CLASS: {paper.header?.grade || targetGrade}</span>
                        <span>TIME: {paper.header?.duration || targetDuration}</span>
                        <span>MAX. MARKS: {totalCalculatedMarks}</span>
                      </div>
                    </div>

                    <div className="font-sans text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                      <span className="font-bold uppercase tracking-wider text-slate-900 block">General Instructions:</span>
                      <ol className="list-decimal pl-4 space-y-0.5">
                        {(paper.header?.instructions || [
                          'All questions are compulsory and carry indicated marks.',
                          'Write answers in clean, legible handwriting.',
                          'Figures to the right indicate full marks for that question.',
                        ]).map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="space-y-6">
                      {paper.sections?.map((section) => (
                        <div key={section.id} className="space-y-3">
                          <div className="border-b border-slate-400 pb-1 flex justify-between items-center">
                            <h4 className="font-sans font-bold text-sm text-slate-900 uppercase">
                              {section.title}
                            </h4>
                            <span className="font-sans text-xs font-bold text-slate-600">
                              [{section.totalSectionMarks || section.questions?.length * (section.marksEach || 1)} Marks]
                            </span>
                          </div>

                          {section.instruction && (
                            <p className="text-xs italic text-slate-600 font-sans">
                              {section.instruction}
                            </p>
                          )}

                          <div className="space-y-4">
                            {section.questions?.map((q, idx) => (
                              <div key={q.id || idx} className="text-sm space-y-1.5">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex gap-2">
                                    <span className="font-bold font-sans shrink-0">Q{idx + 1}.</span>
                                    <div className="space-y-1">
                                      <span className="leading-relaxed">{q.question || q.text}</span>

                                      {q.options && q.options.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 font-sans text-xs">
                                          {q.options.map((opt, optIdx) => (
                                            <div key={optIdx} className="flex items-center gap-1.5">
                                              <span className="font-bold">({String.fromCharCode(65 + optIdx)})</span>
                                              <span>{opt}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {(q.imageUrl || q.diagramSvg || q.diagramUrl) && (
                                        <div className="my-2 p-2 border border-slate-200 rounded-xl bg-white max-w-sm">
                                          <img
                                            src={q.imageUrl || q.diagramUrl}
                                            alt="Exam Diagram"
                                            className="max-h-48 mx-auto object-contain"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <span className="font-sans font-bold text-xs shrink-0 text-slate-800">
                                    [{q.marks || 1} M]
                                  </span>
                                </div>

                                {showTeacherSolutions && (q.answer || q.solution) && (
                                  <div className="font-sans text-xs bg-emerald-50/90 border border-emerald-300 text-emerald-900 p-2.5 rounded-lg mt-1">
                                    <strong className="text-emerald-950">Model Answer / Marking Rubric: </strong>
                                    <span>{q.answer || q.solution}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Right Column: Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <Award className="w-4 h-4" />
                  <span>Board Standards & Blueprints</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Every question paper is calibrated according to standard national curriculum guidelines:
                </p>

                <ul className="text-xs text-slate-700 space-y-2.5 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>CBSE, ICSE & State Boards:</strong> Standard sections (A to E) with objective and descriptive balance.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Bloom's Taxonomy:</strong> 40% Knowledge, 40% Application, 20% HOTS.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Step Marking Rubrics:</strong> Instant teacher marking schemes for each question.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Official A4 Formatting:</strong> Margin-safe layout ready for single or double-sided printing.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-3xl border border-emerald-100 p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>100% Private Client Engine</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Your uploaded PDFs, questions, and school test papers are processed entirely inside your local browser. Zero documents are uploaded to third-party databases.
                </p>

                <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Safe for Confidential School Papers</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Popular Blueprint Templates</span>
                </div>

                <p className="text-xs text-slate-500">
                  One-click preset loading for standard school subjects:
                </p>

                <div className="space-y-2">
                  {POPULAR_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleLoadTemplate(tpl)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 text-left transition group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 group-hover:text-emerald-900">
                          {tpl.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 group-hover:bg-emerald-200 text-slate-700 group-hover:text-emerald-800">
                          Load
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        {tpl.topic}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span>Active Institution Header</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block truncate">
                    {headerConfig.schoolName || 'DELHI PUBLIC SCHOOL, R.K. PURAM'}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {headerConfig.affiliation || 'CBSE Affiliated Senior Secondary'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSwitchTab('preview')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition text-center"
                >
                  Preview Full A4 Paper & Emblem ➔
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
