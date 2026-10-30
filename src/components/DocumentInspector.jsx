import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckSquare, 
  Square, 
  ZoomIn, 
  X, 
  Search, 
  Sparkles, 
  BookOpen, 
  Image as ImageIcon, 
  Check, 
  Printer, 
  Download, 
  Eye, 
  EyeOff, 
  Plus, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileCheck,
  Tag,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Award,
  Sliders,
  RotateCcw,
  RefreshCw,
  School,
  GraduationCap
} from 'lucide-react';
import { extractPdfDocument, processImageFile } from '../utils/pdfExtractor';
import { analyzeDocumentConcepts } from '../utils/documentConceptAnalyzer';
import { generateRealtimePaper, generatePdfGroundedPaper } from '../utils/realtimePaperGenerator';

import { 
  triggerBrowserPrint, 
  downloadElementAsPdf, 
  downloadPaperAsWord 
} from '../utils/exportUtils';
import { scanPdfMultimodal, generatePaperFromModel, fetchApiConfig } from '../utils/backendApi';
import { cropAndSaveAllFigures } from '../utils/diagramCropper';
import { extractDiagramFromPageCanvas } from '../utils/pdfExtractor';
import CustomTopicModal from './CustomTopicModal';
import DiagramWithPointers from './DiagramWithPointers';
import ApiKeyModal from './ApiKeyModal';

export default function DocumentInspector({
  docState,
  setDocState,
  headerConfig = {},
  setHeaderConfig,
  onPaperGenerated,
  paper,
  setPaper,
  onSwitchTab,
  showToast,
}) {
  // ─────────────────────────────────────────────────────────────
  // 4-STEP WIZARD NAVIGATION
  // 1: Upload Subject PDF ➔ 2: Select Topics ➔ 3: Question Types ➔ 4: Final Question Paper
  // ─────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [previewPage, setPreviewPage] = useState(null);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [isCustomTopicModalOpen, setIsCustomTopicModalOpen] = useState(false);
  const [generatingPaper, setGeneratingPaper] = useState(false);
  const [activeFigurePreview, setActiveFigurePreview] = useState(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    fetchApiConfig().then((cfg) => {
      if (cfg && cfg.hasApiKey) {
        setHasApiKey(true);
      }
    });
  }, []);

  const handleStartNewPaper = () => {
    handleClearDocument();
    setCurrentStep(1);
    if (showToast) showToast('Starting new question paper workflow.');
  };

  // -------------------------------------------------------------
  // TOPIC SELECTION STATE
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  
  // Set of selected topic IDs (initialized to all topics of the active document)
  const [selectedTopicIds, setSelectedTopicIds] = useState(() => {
    const initialTopics = docState.topics || [];
    return new Set(initialTopics.map((t) => t.id));
  });

  // Re-sync selected topics when new document is loaded
  useEffect(() => {
    if (docState.topics && docState.topics.length > 0) {
      setSelectedTopicIds(new Set(docState.topics.map((t) => t.id)));
    }
  }, [docState.filename, docState.topics?.length]);

  // Compute pages selected by active topics
  const selectedPagesFromTopics = useMemo(() => {
    const allTopics = docState.topics || [];
    const set = new Set();
    allTopics.forEach((t) => {
      if (selectedTopicIds.has(t.id)) {
        if (t.pages && Array.isArray(t.pages)) {
          t.pages.forEach((p) => set.add(p));
        } else if (t.pageNumber) {
          set.add(t.pageNumber);
        }
      }
    });
    return set;
  }, [docState.topics, selectedTopicIds]);

  // -------------------------------------------------------------
  // QUESTION TYPE SETTINGS WITH COUNTS AND MARKS
  // (MCQ, short answer, long answer, diagram-based, label the diagram)
  // -------------------------------------------------------------
  const [questionSettings, setQuestionSettings] = useState({
    mcq: {
      enabled: true,
      count: 5,
      marks: 1,
      title: 'Multiple Choice (MCQ)',
      description: 'Single-choice question with 4 options and model solution',
    },
    short_answer: {
      enabled: true,
      count: 3,
      marks: 2,
      title: 'Short Answer',
      description: 'Concise conceptual answer in 2-3 sentences',
    },
    long_answer: {
      enabled: true,
      count: 2,
      marks: 5,
      title: 'Long Answer',
      description: 'In-depth explanatory or numerical question with full marks rubric',
    },
    diagram_based: {
      enabled: true,
      count: 1,
      marks: 4,
      title: 'Diagram-based Question',
      description: 'Observation & analysis question based on cropped textbook diagram',
    },
    label_the_diagram: {
      enabled: true,
      count: 1,
      marks: 4,
      title: 'Label the Diagram',
      description: 'Diagram with numbered pointers (1,2,3..) and student write-in blanks',
    },
  });

  const toggleQuestionType = (key) => {
    setQuestionSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }));
  };

  const updateQuestionCount = (key, val) => {
    const num = Math.max(1, Math.min(20, Number(val) || 1));
    setQuestionSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        count: num,
      },
    }));
  };

  const updateQuestionMarks = (key, val) => {
    const num = Math.max(1, Math.min(10, Number(val) || 1));
    setQuestionSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        marks: num,
      },
    }));
  };

  // -------------------------------------------------------------
  // PAPER VIEW & TEACHER SOLUTION TOGGLE
  // -------------------------------------------------------------
  const [showTeacherSolutions, setShowTeacherSolutions] = useState(false);

  // -------------------------------------------------------------
  // CRITICAL PIPELINE: Handle Uploading ANY PDF
  // 1. Render every page as PNG at 150 DPI and extract text.
  // 2. Call multimodal Gemini Flash with page images + text.
  // 3. Crop each figure using bbox and save to figures/<id>.png.
  // 4. Cache analysis per PDF so it runs only once.
  // -------------------------------------------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgressMsg('Step 1/3: Rendering PDF pages at 150 DPI & extracting text...');

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Step 1: 150 DPI rendering via pdf.js
        const extracted = await extractPdfDocument(file, ({ current, total }) => {
          setProgressMsg(`Step 1/3: Rendering page ${current} of ${total} at 150 DPI...`);
        });

        // Step 2: Call multimodal model on backend
        setProgressMsg('Step 2/3: Scanning document chapters & scientific diagrams with Gemini Flash...');
        let scanResult = null;
        let figures = [];

        try {
          scanResult = await scanPdfMultimodal({
            pdfHash: extracted.pdfHash,
            pages: extracted.pages,
          });

          if (scanResult && scanResult.figures) {
            figures = scanResult.figures;
          }
        } catch (apiErr) {
          console.warn('Multimodal scan notice:', apiErr.message);
          if (showToast) {
            showToast(`ℹ️ ${apiErr.message || 'API key needed in .env for AI scan; falling back to local analysis.'}`);
          }
        }

        // If multimodal scan didn't return chapters, fall back to local concept analyzer
        let chapters = scanResult?.chapters;
        let topics = [];

        if (chapters && chapters.length > 0) {
          let topicIdCounter = 1;
          chapters.forEach((chap, cIdx) => {
            chap.id = chap.id || `chap-${cIdx + 1}`;
            (chap.topics || []).forEach((top) => {
              top.id = top.id || `topic-${topicIdCounter++}`;
              top.chapterId = chap.id;
              top.chapterName = chap.name;
              top.pageNumber = (top.pages && top.pages[0]) || 1;
              topics.push(top);
            });
          });
        } else {
          const fallback = analyzeDocumentConcepts(extracted.pages);
          chapters = fallback.chapters;
          topics = fallback.topics;
        }

        // Step 3: Crop each figure from the 150 DPI page image canvas and save to figures/<id>.png
        if (figures && figures.length > 0) {
          setProgressMsg(`Step 3/3: Cropping ${figures.length} detected science diagrams to figures/<id>.png...`);
          figures = await cropAndSaveAllFigures(figures, extracted.pages);
        } else {
          // Direct canvas diagram extractor: copy and extract diagrams directly from PDF pages with illustrations
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
                    labels_present: ['Part (1)', 'Part (2)', 'Part (3)', 'Part (4)'],
                  });
                  if (figures.length >= 8) break;
                } catch (cropErr) {
                  console.warn(`Could not auto-crop figure on page ${page.pageNumber}:`, cropErr);
                }
              }
            }
          }
        }

        setDocState({
          loaded: true,
          type: 'pdf',
          filename: file.name,
          fileSize: extracted.fileSize,
          totalPages: extracted.totalPages,
          pages: extracted.pages,
          chapters,
          topics,
          figures,
          rawFile: file,
          pdfHash: extracted.pdfHash,
        });

        setActivePageNumber(1);
        if (showToast) {
          showToast(`✓ Analyzed "${file.name}"! Found ${chapters?.length || 0} chapters, ${topics.length} topics & ${figures.length} figures.`);
        }
      } else {
        // Image upload
        setProgressMsg('Processing uploaded image at 150 DPI...');
        const imgPage = await processImageFile(file);
        const { chapters, topics } = analyzeDocumentConcepts([imgPage]);
        setDocState({
          loaded: true,
          type: 'image',
          filename: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          totalPages: 1,
          pages: [imgPage],
          chapters,
          topics,
          figures: [],
        });
        setActivePageNumber(1);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load document: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Clear current document to upload another
  const handleClearDocument = () => {
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
    setSelectedTopicIds(new Set());
    setActivePageNumber(1);
  };

  // Scroll smoothly to a specific page on the left PDF viewer
  const scrollToPage = (pageNum) => {
    setActivePageNumber(pageNum);
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle single topic selection
  const toggleTopicSelect = (topicId) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  // Toggle all topics of a chapter
  const toggleChapterTopics = (chap) => {
    const chapTopicIds = (chap.topics || []).map((t) => t.id);
    const allSelected = chapTopicIds.length > 0 && chapTopicIds.every((id) => selectedTopicIds.has(id));

    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        chapTopicIds.forEach((id) => next.delete(id));
      } else {
        chapTopicIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Add custom topic
  const handleAddCustomTopic = (newTopic, newChapter) => {
    setDocState((prev) => {
      const updatedTopics = [...(prev.topics || []), newTopic];
      let updatedChapters = [...(prev.chapters || [])];
      if (newChapter && !updatedChapters.some((c) => c.id === newChapter.id)) {
        updatedChapters.push(newChapter);
      }
      return {
        ...prev,
        topics: updatedTopics,
        chapters: updatedChapters,
      };
    });
    setSelectedTopicIds((prev) => new Set(prev).add(newTopic.id));
    scrollToPage(newTopic.pageNumber);
    if (showToast) {
      showToast(`✨ Custom topic "${newTopic.name}" added to Page ${newTopic.pageNumber}!`);
    }
  };

  // -------------------------------------------------------------
  // Filtered Chapters & Topics Hierarchy
  // -------------------------------------------------------------
  const chaptersHierarchy = useMemo(() => {
    const chaps = docState.chapters || [];
    const allTopics = docState.topics || [];
    const query = searchQuery.trim().toLowerCase();

    // Filter topics by search query
    const matchingTopics = query
      ? allTopics.filter(
          (t) =>
            (t.name || '').toLowerCase().includes(query) ||
            (t.cleanName || '').toLowerCase().includes(query) ||
            (t.chapterName || '').toLowerCase().includes(query)
        )
      : allTopics;

    if (chaps.length === 0) {
      return [
        {
          id: 'ch-default',
          name: 'Curriculum Chapters & Topics',
          topics: matchingTopics,
        },
      ];
    }

    const assignedIds = new Set();
    const result = chaps
      .map((chap) => {
        const matching = matchingTopics.filter((t) => {
          if (t.chapterId === chap.id) return true;
          if (
            t.chapterName &&
            chap.name &&
            t.chapterName.toLowerCase().trim() === chap.name.toLowerCase().trim()
          ) {
            return true;
          }
          if (chap.pages && chap.pages.includes(t.pageNumber)) return true;
          return false;
        });
        matching.forEach((t) => assignedIds.add(t.id));
        return {
          ...chap,
          topics: matching,
        };
      })
      .filter((chap) => chap.topics.length > 0 || !query);

    const unassigned = matchingTopics.filter((t) => !assignedIds.has(t.id));
    if (unassigned.length > 0) {
      result.push({
        id: 'ch-other',
        name: 'Additional Curriculum Topics',
        topics: unassigned,
      });
    }

    return result;
  }, [docState.chapters, docState.topics, searchQuery]);

  // Figures detected on selected pages
  const availableFigures = useMemo(() => {
    const allFigures = docState.figures || [];
    if (allFigures.length === 0) return [];

    if (selectedPagesFromTopics.size === 0) return allFigures;
    return allFigures.filter((f) => selectedPagesFromTopics.has(f.page));
  }, [docState.figures, selectedPagesFromTopics]);

  // -------------------------------------------------------------
  // Synchronous Local Realtime Paper Generator (Live fallback preview)
  // -------------------------------------------------------------
  const realtimePaper = useMemo(() => {
    if (!docState.loaded && (!selectedTopicIds || selectedTopicIds.size === 0)) {
      return {
        header: headerConfig,
        sections: [],
        totalCalculatedMarks: 0,
        totalQuestionCount: 0,
      };
    }

    return generateRealtimePaper({
      docState,
      selectedTopicIds,
      selectedPagesFromTopics,
      questionSettings,
      headerConfig,
      figures: availableFigures,
    });
  }, [docState, selectedTopicIds, selectedPagesFromTopics, questionSettings, headerConfig, availableFigures]);

  // Sync realtimePaper with global parent paper state only when a document or topic is loaded
  useEffect(() => {
    if (docState.loaded && setPaper && realtimePaper && realtimePaper.sections && realtimePaper.sections.length > 0) {
      setPaper(realtimePaper);
    }
  }, [realtimePaper, setPaper, docState.loaded]);

  // -------------------------------------------------------------
  // STEP NAVIGATION & PAPER GENERATION HANDLERS
  // -------------------------------------------------------------
  const handleProceedToStep2 = () => {
    if (!docState.loaded) {
      if (showToast) showToast('Please upload a subject PDF first to begin AI analysis.');
      return;
    }
    setCurrentStep(2);
  };

  const handleProceedToStep3 = () => {
    if (selectedTopicIds.size === 0) {
      const allTopicIds = new Set((docState.topics || []).map((t) => t.id));
      setSelectedTopicIds(allTopicIds);
      if (showToast) showToast('Auto-selected all textbook topics to proceed.');
    }
    setCurrentStep(3);
  };

  const handleProceedToStep4 = () => {
    handleTriggerAiGeneration();
    setCurrentStep(4);
  };

  const handleSelectAllTopics = () => {
    const allTopicIds = new Set((docState.topics || []).map((t) => t.id));
    setSelectedTopicIds(allTopicIds);
    if (showToast) showToast(`✓ Selected all ${allTopicIds.size} topics`);
  };

  const handleDeselectAllTopics = () => {
    setSelectedTopicIds(new Set());
    if (showToast) showToast('Cleared topic selection');
  };

  // -------------------------------------------------------------
  // STEP 5: Trigger Full AI Multimodal Question Paper Generation
  // Generates questions directly from PDF content + Cloud Gemini AI if key is set
  // -------------------------------------------------------------
  const handleTriggerAiGeneration = async () => {
    setGeneratingPaper(true);
    setCurrentStep(4);
    if (showToast) showToast('🚀 Generating comprehensive question paper from your PDF...');

    try {
      const allTopics = docState.topics || [];
      const selectedTopics = allTopics.filter((t) => selectedTopicIds.has(t.id));

      const selectedPages = (docState.pages || []).filter((p) =>
        selectedPagesFromTopics.has(p.pageNumber)
      );

      const result = await generatePaperFromModel({
        selectedTopics,
        selectedPages: selectedPages.length > 0 ? selectedPages : docState.pages || [],
        questionSettings,
        figures: availableFigures.length > 0 ? availableFigures : docState.figures || [],
        headerConfig,
      });

      if (result && result.paper) {
        if (setPaper) setPaper(result.paper);
        if (onPaperGenerated) onPaperGenerated(result.paper);
        setCurrentStep(4);
        if (showToast) {
          if (result.fallback) {
            showToast('✓ Generated question paper directly from your uploaded PDF! (Add Gemini API key in Settings for Cloud AI)');
          } else {
            showToast('✨ Generated comprehensive question paper with Cloud Gemini AI!');
          }
        }
      } else {
        throw new Error('No paper structure returned from model');
      }
    } catch (err) {
      console.warn('Paper generation fallback:', err);
      // Generate paper directly using local PDF engine so teacher is NEVER blocked
      const localPaper = generatePdfGroundedPaper({
        docState,
        selectedTopicIds,
        selectedPagesFromTopics,
        questionSettings,
        headerConfig,
        figures: availableFigures,
      });

      if (setPaper) setPaper(localPaper);
      if (onPaperGenerated) onPaperGenerated(localPaper);
      setCurrentStep(4);
      if (showToast) {
        showToast('✓ Generated question paper directly from your uploaded PDF!');
      }
    } finally {
      setGeneratingPaper(false);
    }
  };

  const totalCalculatedMarks = paper?.totalCalculatedMarks || realtimePaper.totalCalculatedMarks || 0;
  const totalQuestions = paper?.totalQuestionCount || realtimePaper.totalQuestionCount || 0;
  const totalPagesCount = docState.pages?.length || 0;

  // Active display paper (only show when a document is loaded or user has active topics)
  const displayPaper = (docState.loaded || (docState.topics && docState.topics.length > 0))
    ? (paper && paper.sections && paper.sections.length > 0 ? paper : realtimePaper)
    : { header: headerConfig, sections: [] };

  return (
    <div className="space-y-3 pb-8">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* TOP WIZARD STEPPER & NAVIGATION BAR (VISIBLE WHEN LOADED)    */}
      {/* ──────────────────────────────────────────────────────────── */}
      {docState.loaded && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-1 z-30 backdrop-blur-md">
        
        {/* Left: Back Button & Context Title */}
        <div className="flex items-center gap-2.5">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 shadow-sm"
              title="Go back to previous step"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {currentStep === 2 && 'Back: PDF Upload'}
                {currentStep === 3 && 'Back: Select Topics'}
                {currentStep === 4 && 'Back: Question Types'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Question Paper Studio</span>
                {docState.loaded && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {docState.filename} ({totalPagesCount} Pgs)
                  </span>
                )}
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">
                {currentStep === 1 && 'Step 1 of 4: Upload Subject PDF & Setup Exam'}
                {currentStep === 2 && `Step 2 of 4: Select Topics (${selectedTopicIds.size} Topics Selected)`}
                {currentStep === 3 && `Step 3 of 4: Question Types & Marks (${totalCalculatedMarks} Marks)`}
                {currentStep === 4 && 'Step 4 of 4: Final Board Examination Paper Preview'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: 4-Step Interactive Breadcrumb Stepper */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
              currentStep === 1
                ? 'bg-indigo-600 text-white shadow-md'
                : docState.loaded
                ? 'text-emerald-400 hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/60 flex items-center justify-center text-[10px]">
              {docState.loaded ? '✓' : '1'}
            </span>
            <span>1. Upload PDF</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => {
              if (!docState.loaded) handleProceedToStep2();
              else setCurrentStep(2);
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
              currentStep === 2
                ? 'bg-indigo-600 text-white shadow-md'
                : selectedTopicIds.size > 0
                ? 'text-emerald-400 hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/60 flex items-center justify-center text-[10px]">
              {selectedTopicIds.size > 0 ? '✓' : '2'}
            </span>
            <span>2. Select Topics</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
              currentStep === 3
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/60 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>3. Question Types</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          {/* Step 4 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
              currentStep === 4
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/60 flex items-center justify-center text-[10px]">
              4
            </span>
            <span>4. Final Paper</span>
          </button>

        </div>

        {/* Right: The Requested Prominent "NEXT" Button on TOP */}
        <div className="flex items-center gap-2">
          
          {/* STEP 1 NEXT BUTTON */}
          {currentStep === 1 && (
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 transform hover:-translate-y-0.5"
            >
              <span>Next: Select Topics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* STEP 2 NEXT BUTTON */}
          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleProceedToStep3}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 transform hover:-translate-y-0.5"
            >
              <span>Next: Question Types</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {selectedTopicIds.size}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* STEP 3 NEXT BUTTON */}
          {currentStep === 3 && (
            <button
              type="button"
              disabled={generatingPaper}
              onClick={handleProceedToStep4}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {generatingPaper ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Paper...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Next: Generate Final Paper ({totalCalculatedMarks}M)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {/* STEP 4 EXPORT & ACTION CONTROLS */}
          {currentStep === 4 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Teacher Solutions Toggle */}
              <button
                type="button"
                onClick={() => setShowTeacherSolutions(!showTeacherSolutions)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                  showTeacherSolutions
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Toggle between Student Paper and Teacher Solution Scheme"
              >
                {showTeacherSolutions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showTeacherSolutions ? 'Answers ON' : 'Answers'}</span>
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={() => triggerBrowserPrint()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                title="Print Examination Paper (A4)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              {/* Word Export */}
              <button
                type="button"
                onClick={() => downloadPaperAsWord(displayPaper, headerConfig)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                title="Download as Microsoft Word (.doc)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word</span>
              </button>

              {/* PDF Export */}
              <button
                type="button"
                onClick={() => downloadElementAsPdf('realtime-question-paper', `${headerConfig.subject || 'Question_Paper'}_Exam.pdf`)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                title="Download as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              {/* Reset / New Paper */}
              <button
                type="button"
                onClick={handleStartNewPaper}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 flex items-center gap-1"
                title="Start a fresh question paper wizard"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Paper</span>
              </button>
            </div>
          )}

        </div>

      </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 1: ONLY "SELECT SUBJECT PDF"                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 1 (UNLOADED): CENTERED "SELECT SUBJECT PDF" CARD        */}
      {/* ──────────────────────────────────────────────────────────── */}
      {currentStep === 1 && !docState.loaded && (
        <div className="min-h-[65vh] flex flex-col items-center justify-center p-4 relative animate-fade-in">
          {/* Ambient Glowing Orbs behind the card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-indigo-600/25 via-violet-600/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* If AI is analyzing the uploaded PDF */}
          {loading ? (
            <div className="relative z-10 max-w-sm w-full p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-indigo-500/40 text-center space-y-5 shadow-2xl backdrop-blur-xl">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200/30 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-emerald-200/30 border-b-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="w-full h-full flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  AI is Analyzing the Whole PDF...
                </h3>
                <p className="text-xs text-indigo-400 font-medium">
                  {progressMsg || 'Rendering pages at 150 DPI & extracting curriculum concepts...'}
                </p>
              </div>
            </div>
          ) : (
            /* COMPACT, CENTERED, ULTRA-ATTRACTIVE CARD */
            <label className="group relative z-10 max-w-sm w-full cursor-pointer block rounded-3xl border border-slate-700/60 hover:border-indigo-500/70 p-8 sm:p-10 text-center bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-1">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {/* Sparkle badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold tracking-wide uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Question Paper Studio</span>
              </div>

              {/* Glowing Icon Container */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 ring-8 ring-indigo-500/15 group-hover:scale-110 group-hover:ring-indigo-500/30 transition-all duration-300">
                <Upload className="w-9 h-9 text-white group-hover:-translate-y-0.5 transition-transform" />
              </div>

              {/* Prominent "Select Subject PDF" Button */}
              <div className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm sm:text-base font-bold shadow-xl shadow-indigo-600/30 transition-all duration-200 transform group-hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-200" />
                <span>Select Subject PDF</span>
              </div>

              {/* Supporting info */}
              <p className="text-[11px] text-slate-400 font-medium mt-4">
                Upload textbook, syllabus, or question bank
              </p>
              <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                PDF • PNG • JPG • Scanned Docs
              </div>

              {/* Micro feature pills */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-950/70 text-slate-300 border border-slate-800 flex items-center gap-1">
                  <span>⚡</span> <span>150 DPI Scan</span>
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-950/70 text-slate-300 border border-slate-800 flex items-center gap-1">
                  <span>📑</span> <span>Auto Topics</span>
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-950/70 text-slate-300 border border-slate-800 flex items-center gap-1">
                  <span>🎯</span> <span>Exam Blueprint</span>
                </span>
              </div>
            </label>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 1 (LOADED): AI ANALYSIS REPORT & PROCEED TO TOPICS      */}
      {/* ──────────────────────────────────────────────────────────── */}
      {currentStep === 1 && docState.loaded && (
        <div className="animate-fade-in max-w-4xl mx-auto py-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* AI Analysis Success Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>AI Successfully Analyzed Whole PDF!</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {totalPagesCount} Pages Ready
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 font-mono">
                    {docState.filename} {docState.fileSize && `• ${docState.fileSize}`}
                  </p>
                </div>
              </div>

              <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 shrink-0 text-center">
                <span>Upload Different PDF</span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* 4 AI Analysis Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pages Analyzed</span>
                <span className="text-xl font-black text-emerald-400">{totalPagesCount}</span>
                <span className="text-[10px] text-slate-500 block">150 DPI Scans</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chapters</span>
                <span className="text-xl font-black text-indigo-400">{docState.chapters?.length || 1}</span>
                <span className="text-[10px] text-slate-500 block">Identified</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Topics Extracted</span>
                <span className="text-xl font-black text-violet-400">{docState.topics?.length || 0}</span>
                <span className="text-[10px] text-slate-500 block">Concepts Found</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagrams Found</span>
                <span className="text-xl font-black text-amber-400">{docState.figures?.length || 0}</span>
                <span className="text-[10px] text-slate-500 block">Isolated Figures</span>
              </div>
            </div>

            {/* Extracted Chapters & Topics from this PDF */}
            {docState.topics && docState.topics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Curriculum Chapters & Topics Extracted by AI ({docState.topics.length})</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">Ready for Question Generation</span>
                </div>

                <div className="max-h-48 overflow-y-auto p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                  {(docState.chapters || []).map((chap, cIdx) => {
                    const chapTopics = (chap.topics && chap.topics.length > 0)
                      ? chap.topics
                      : docState.topics.filter((t) => t.chapterId === chap.id);

                    return (
                      <div key={chap.id || cIdx} className="space-y-1.5">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>{chap.name}</span>
                          {chap.pages?.length > 0 && (
                            <span className="text-[10px] text-slate-500">
                              (Pgs {chap.pages[0]}–{chap.pages[chap.pages.length - 1]})
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-3">
                          {chapTopics.slice(0, 12).map((top, tIdx) => (
                            <span
                              key={top.id || tIdx}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
                            >
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{top.cleanName || top.name}</span>
                            </span>
                          ))}
                          {chapTopics.length > 12 && (
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-semibold">
                              +{chapTopics.length - 12} more topics
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Page Thumbnails Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                <span>Analyzed PDF Pages ({totalPagesCount})</span>
                <span>Click any page to zoom in 150 DPI</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                {(docState.pages || []).map((page) => (
                  <div
                    key={page.pageNumber}
                    onClick={() => setPreviewPage(page)}
                    className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500 bg-slate-900 transition shadow-md"
                  >
                    {page.dataUrl ? (
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-28 object-cover object-top opacity-85 group-hover:opacity-100 transition"
                      />
                    ) : (
                      <div className="w-full h-28 p-2 text-[8px] text-slate-400 font-mono overflow-hidden">
                        {page.text?.slice(0, 100)}...
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 px-2 py-1 text-center text-[10px] font-bold text-white flex items-center justify-between">
                      <span>Page {page.pageNumber}</span>
                      <ZoomIn className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Big Proceed Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
              >
                <span>Proceed to Step 2: Select Curriculum Topics ({docState.topics?.length || 0} Topics Found)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 2: SELECT TOPICS PAGE ("WHICH TOPIC YOU HAVE TO SELECT") */}
      {/* ──────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-3 animate-fade-in">
          
          {/* Sub-Header Actions Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Which topics do you want to include?
                </h3>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  ● {selectedTopicIds.size} of {docState.topics?.length || 0} topics selected • Covering {selectedPagesFromTopics.size} pages
                </span>
              </div>
            </div>

            {/* Search and Bulk Select Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter topics..."
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
                />
              </div>

              <button
                type="button"
                onClick={handleSelectAllTopics}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
              >
                Select All
              </button>

              <button
                type="button"
                onClick={handleDeselectAllTopics}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={() => setIsCustomTopicModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Topic</span>
              </button>

              {/* Next Button also here */}
              <button
                type="button"
                onClick={handleProceedToStep3}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <span>Next: Question Types</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Two-Column Workspace: Left (PDF Visual Preview) | Right (Topics Tree) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3" style={{ height: 'calc(100vh - 210px)', minHeight: '500px' }}>
            
            {/* LEFT (4 cols): PDF Page Visual Reference */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>PDF Visual Pages ({totalPagesCount})</span>
                </span>
                <span className="text-[10px] text-slate-400">150 DPI Resolution</span>
              </div>

              {/* Scrollable list of page cards */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 pr-1">
                {(docState.pages || []).map((page) => {
                  const isPageSelected = selectedPagesFromTopics.has(page.pageNumber);
                  const pageFigures = (docState.figures || []).filter((f) => f.page === page.pageNumber);

                  return (
                    <div
                      key={page.pageNumber}
                      id={`pdf-page-${page.pageNumber}`}
                      onClick={() => setActivePageNumber(page.pageNumber)}
                      className={`rounded-xl border p-2 transition cursor-pointer flex gap-3 ${
                        activePageNumber === page.pageNumber
                          ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500'
                          : isPageSelected
                          ? 'bg-slate-950/80 border-emerald-500/40'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-28 rounded bg-slate-900 overflow-hidden shrink-0 border border-slate-700">
                        {page.dataUrl ? (
                          <img
                            src={page.dataUrl}
                            alt={`Page ${page.pageNumber}`}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="p-1 text-[8px] text-slate-400 overflow-hidden font-mono">
                            {page.text?.slice(0, 80)}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPage(page);
                          }}
                          className="absolute inset-0 bg-slate-950/50 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white"
                          title="Zoom Page"
                        >
                          <ZoomIn className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Page Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              Page {page.pageNumber}
                            </span>
                            {isPageSelected && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                                Active
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                            {page.text ? page.text.slice(0, 140) + '...' : 'No raw text extractable'}
                          </p>
                        </div>

                        {/* Diagrams detected on this page */}
                        {pageFigures.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap gap-1">
                            {pageFigures.map((fig) => (
                              <button
                                key={fig.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFigurePreview(fig);
                                }}
                                className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1"
                              >
                                <ImageIcon className="w-2.5 h-2.5" />
                                <span>{fig.caption?.slice(0, 18) || 'Figure'}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT (8 cols): Chapter & Topic Selection Tree */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Chapter & Topic Selection Tree
                  </h4>
                </div>
                <span className="text-xs text-slate-400">
                  Tick checkboxes to select topics for exam
                </span>
              </div>

              {/* Scrollable Topics Tree */}
              <div className="flex-1 overflow-y-auto space-y-3 pt-2 pr-1">
                {chaptersHierarchy.map((chap) => {
                  const chapTopicIds = (chap.topics || []).map((t) => t.id);
                  const isAllChapSelected = chapTopicIds.length > 0 && chapTopicIds.every((id) => selectedTopicIds.has(id));
                  const isPartiallySelected = !isAllChapSelected && chapTopicIds.some((id) => selectedTopicIds.has(id));

                  return (
                    <div
                      key={chap.id}
                      className="bg-slate-950/70 border border-slate-800/90 rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Chapter Header */}
                      <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isAllChapSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isPartiallySelected;
                            }}
                            onChange={() => toggleChapterTopics(chap)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-white truncate">
                            {chap.name}
                          </span>
                        </label>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {chap.pages && chap.pages.length > 0 && (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                              Pages {chap.pages[0]}–{chap.pages[chap.pages.length - 1]}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                            {chap.topics.length} Topics
                          </span>
                        </div>
                      </div>

                      {/* Topics List */}
                      <div className="divide-y divide-slate-850/60 p-1">
                        {chap.topics.map((topic) => {
                          const isSelected = selectedTopicIds.has(topic.id);
                          const hasDiagram = (docState.figures || []).some((f) => f.page === topic.pageNumber);

                          return (
                            <div
                              key={topic.id}
                              onClick={() => toggleTopicSelect(topic.id)}
                              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-indigo-600/10 hover:bg-indigo-600/15'
                                  : 'hover:bg-slate-900/50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleTopicSelect(topic.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className={`text-xs ${isSelected ? 'font-bold text-white' : 'text-slate-300'} truncate`}>
                                  {topic.name || topic.cleanName}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {hasDiagram && (
                                  <span className="text-[9.5px] font-semibold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/25 flex items-center gap-1">
                                    <ImageIcon className="w-2.5 h-2.5" />
                                    <span>Diagram</span>
                                  </span>
                                )}

                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    scrollToPage(topic.pageNumber);
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded-full font-mono cursor-pointer"
                                  title="View page"
                                >
                                  Pg {topic.pageNumber}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Continue Action */}
              <div className="pt-2 border-t border-slate-800 shrink-0 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Ready to configure questions from these <strong>{selectedTopicIds.size} topics</strong>?
                </span>
                <button
                  type="button"
                  onClick={handleProceedToStep3}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Proceed to Step 3: Question Types</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 3: QUESTION TYPES & MARKS PAGE ("QUESTION TYPE PAGE")   */}
      {/* ──────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
          
          {/* Blueprint Summary Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Calculated
                </span>
                <span className="text-lg font-black text-white">
                  {totalCalculatedMarks} Marks
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Questions
                </span>
                <span className="text-lg font-black text-white">
                  {totalQuestions} Questions
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Exam Duration
                </span>
                <span className="text-lg font-black text-white">
                  {headerConfig.duration || '3 Hours'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Curriculum Topics
                </span>
                <span className="text-lg font-black text-white">
                  {selectedTopicIds.size} Topics
                </span>
              </div>
            </div>

          </div>

          {/* Question Type Cards Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Configure Question Types & Marks Allocation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click checkboxes to enable or disable sections. Adjust question counts and marks per question.
                </p>
              </div>

              <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Sum: {totalCalculatedMarks} / {headerConfig.maxMarks || 80} Marks
              </div>
            </div>

            {/* List of 5 Question Types */}
            <div className="space-y-3">
              
              {/* 1. Multiple Choice Questions (MCQ) */}
              <div className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                questionSettings.mcq.enabled
                  ? 'bg-slate-950/80 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-950/30 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={questionSettings.mcq.enabled}
                    onChange={() => toggleQuestionType('mcq')}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-1 cursor-pointer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Section A: Multiple Choice Questions (MCQs)</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                        4 Options (A, B, C, D)
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Single correct answer questions with authentic textbook distractors and step-by-step reasoning.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Count:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={questionSettings.mcq.count}
                      onChange={(e) => updateQuestionCount('mcq', e.target.value)}
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-white font-bold"
                    />
                  </div>
                  <span className="text-slate-500">×</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Marks:</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={questionSettings.mcq.marks}
                      onChange={(e) => updateQuestionMarks('mcq', e.target.value)}
                      className="w-10 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-emerald-400 font-bold"
                    />
                  </div>
                  <span className="text-xs font-black text-indigo-300 min-w-[50px] text-right">
                    = {questionSettings.mcq.count * questionSettings.mcq.marks} Marks
                  </span>
                </div>
              </div>

              {/* 2. Short Answer Questions */}
              <div className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                questionSettings.short_answer.enabled
                  ? 'bg-slate-950/80 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-950/30 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={questionSettings.short_answer.enabled}
                    onChange={() => toggleQuestionType('short_answer')}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-1 cursor-pointer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Section B: Short Answer Questions</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        2-3 Sentences
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Conceptual definitions, scientific reasoning, differences between concepts, and formula applications.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Count:</span>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={questionSettings.short_answer.count}
                      onChange={(e) => updateQuestionCount('short_answer', e.target.value)}
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-white font-bold"
                    />
                  </div>
                  <span className="text-slate-500">×</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Marks:</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={questionSettings.short_answer.marks}
                      onChange={(e) => updateQuestionMarks('short_answer', e.target.value)}
                      className="w-10 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-emerald-400 font-bold"
                    />
                  </div>
                  <span className="text-xs font-black text-indigo-300 min-w-[50px] text-right">
                    = {questionSettings.short_answer.count * questionSettings.short_answer.marks} Marks
                  </span>
                </div>
              </div>

              {/* 3. Long Answer Questions */}
              <div className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                questionSettings.long_answer.enabled
                  ? 'bg-slate-950/80 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-950/30 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={questionSettings.long_answer.enabled}
                    onChange={() => toggleQuestionType('long_answer')}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-1 cursor-pointer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Section C: Long Answer & Explanatory Questions</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-violet-500/20 text-violet-300 font-semibold">
                        Detailed Rubric
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      In-depth theoretical questions, law derivations, multi-part descriptive questions with mark breakdown.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Count:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={questionSettings.long_answer.count}
                      onChange={(e) => updateQuestionCount('long_answer', e.target.value)}
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-white font-bold"
                    />
                  </div>
                  <span className="text-slate-500">×</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Marks:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={questionSettings.long_answer.marks}
                      onChange={(e) => updateQuestionMarks('long_answer', e.target.value)}
                      className="w-10 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-emerald-400 font-bold"
                    />
                  </div>
                  <span className="text-xs font-black text-indigo-300 min-w-[50px] text-right">
                    = {questionSettings.long_answer.count * questionSettings.long_answer.marks} Marks
                  </span>
                </div>
              </div>

              {/* 4. Diagram-Based Questions (Multimodal) */}
              <div className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                questionSettings.diagram_based.enabled
                  ? 'bg-slate-950/80 border-amber-500/50 shadow-sm'
                  : 'bg-slate-950/30 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={questionSettings.diagram_based.enabled}
                    onChange={() => toggleQuestionType('diagram_based')}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 mt-1 cursor-pointer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-amber-300">Section D: Diagram-Based Questions (Multimodal)</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                        {availableFigures.length} Figures Available
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Questions grounded on textbook diagrams detected from your selected topics with observation sub-questions.
                    </p>

                    {/* Figure preview thumbnails */}
                    {availableFigures.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {availableFigures.slice(0, 3).map((fig) => (
                          <div
                            key={fig.id}
                            onClick={() => setActiveFigurePreview(fig)}
                            className="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-[10px] text-amber-300 hover:bg-slate-800"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>{fig.caption?.slice(0, 16)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Count:</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={questionSettings.diagram_based.count}
                      onChange={(e) => updateQuestionCount('diagram_based', e.target.value)}
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-white font-bold"
                    />
                  </div>
                  <span className="text-slate-500">×</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Marks:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={questionSettings.diagram_based.marks}
                      onChange={(e) => updateQuestionMarks('diagram_based', e.target.value)}
                      className="w-10 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <span className="text-xs font-black text-amber-300 min-w-[50px] text-right">
                    = {questionSettings.diagram_based.count * questionSettings.diagram_based.marks} Marks
                  </span>
                </div>
              </div>

              {/* 5. Label the Diagram */}
              <div className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                questionSettings.label_the_diagram.enabled
                  ? 'bg-slate-950/80 border-amber-500/50 shadow-sm'
                  : 'bg-slate-950/30 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={questionSettings.label_the_diagram.enabled}
                    onChange={() => toggleQuestionType('label_the_diagram')}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 mt-1 cursor-pointer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-amber-300">Section E: Label the Diagram</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                        Numbered Pointers (1, 2, 3...)
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scientific diagram with parts labeled by numbers. Students write the names of the parts in the examination paper.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Count:</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={questionSettings.label_the_diagram.count}
                      onChange={(e) => updateQuestionCount('label_the_diagram', e.target.value)}
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-white font-bold"
                    />
                  </div>
                  <span className="text-slate-500">×</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <span className="text-[11px] text-slate-400 px-1 font-semibold">Marks:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={questionSettings.label_the_diagram.marks}
                      onChange={(e) => updateQuestionMarks('label_the_diagram', e.target.value)}
                      className="w-10 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <span className="text-xs font-black text-amber-300 min-w-[50px] text-right">
                    = {questionSettings.label_the_diagram.count * questionSettings.label_the_diagram.marks} Marks
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Generate Question Paper Button */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Total examination marks: <strong className="text-white">{totalCalculatedMarks} Marks</strong> across <strong className="text-white">{totalQuestions} Questions</strong>.
              </span>

              <button
                type="button"
                disabled={generatingPaper}
                onClick={handleProceedToStep4}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
              >
                {generatingPaper ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Final Question Paper...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Final Question Paper ({totalCalculatedMarks} Marks) ➔</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 4: FINAL QUESTION PAPER ("THE FINAL QUESTION IS SEEN")  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
          
          {/* Top Paper Header Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Final Examination Question Paper
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                ● CBSE / State Board Layout • {totalQuestions} Questions • {totalCalculatedMarks} Maximum Marks
              </span>
            </div>

            {/* Actions: Toggle Solutions, Print, PDF, Word */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowTeacherSolutions(!showTeacherSolutions)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  showTeacherSolutions
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Toggle between Student Paper and Teacher Solution Scheme"
              >
                {showTeacherSolutions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showTeacherSolutions ? 'Answers ON' : 'Teacher Answers'}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerBrowserPrint()}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Print Examination Paper (A4 Format)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => downloadPaperAsWord(displayPaper, headerConfig)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Download as Microsoft Word document (.doc)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word (.doc)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadElementAsPdf('realtime-question-paper', `${headerConfig.subject || 'Question_Paper'}_Exam.pdf`)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Download as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 flex items-center gap-1"
                title="Go back to adjust questions or marks"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Edit Settings</span>
              </button>
            </div>
          </div>

          {/* A4 QUESTION PAPER CONTAINER */}
          <div className="bg-slate-950 p-2 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto">
            <div
              id="realtime-question-paper"
              className="bg-white text-slate-900 rounded-xl p-8 sm:p-10 shadow-lg border border-slate-300 font-serif max-w-4xl mx-auto min-h-[900px]"
            >
              {displayPaper.sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mb-3" />
                  <h4 className="text-base font-bold text-slate-800">
                    No Questions Generated Yet
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Go back to Step 1 or Step 2 to select curriculum topics, then click Generate Question Paper.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Start with Step 1
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Paper Header (School, Exam, Class, Subject, Marks) */}
                  <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
                    <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide text-slate-900">
                      {headerConfig.schoolName || 'DELHI PUBLIC SCHOOL'}
                    </h1>
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                      {displayPaper.header.examTitle || headerConfig.examTitle || 'ANNUAL ASSESSMENT EXAMINATION'}
                    </h2>
                    
                    <div className="flex flex-wrap items-center justify-between text-xs font-sans font-semibold pt-2 text-slate-700 border-t border-slate-300 mt-2">
                      <span><strong>Subject:</strong> {displayPaper.header.subject || headerConfig.subject}</span>
                      <span><strong>Class:</strong> {displayPaper.header.grade || headerConfig.grade}</span>
                      <span><strong>Time Allowed:</strong> {displayPaper.header.duration || headerConfig.duration || '3 Hours'}</span>
                      <span><strong>Maximum Marks:</strong> {totalCalculatedMarks}</span>
                    </div>
                  </div>

                  {/* General Instructions */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] font-sans text-slate-700">
                    <span className="font-bold block mb-1">General Instructions:</span>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[10.5px]">
                      {(displayPaper.header.instructions || [
                        'All questions are compulsory.',
                        'The question paper comprises of 5 sections: A, B, C, D, and E.',
                        'Section A contains MCQs of 1 mark each.',
                        'Section B contains Short Answer Questions.',
                        'Section C contains Long Answer Explanatory Questions.',
                        'Section D contains Diagram-Based Observation Questions.',
                        'Section E contains Label the Diagram Questions.',
                        'Draw neat and labeled diagrams wherever necessary.',
                      ]).map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Render Sections & Questions */}
                  <div className="space-y-6">
                    {displayPaper.sections.map((sec, secIdx) => (
                      <div key={sec.id || secIdx} className="space-y-3 break-inside-avoid">
                        
                        {/* Section Title */}
                        <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                          <div className="font-sans font-bold text-xs uppercase tracking-wide text-slate-900">
                            SECTION {sec.letter || String.fromCharCode(65 + secIdx)}: {sec.title}
                          </div>
                          <span className="font-sans font-bold text-xs text-slate-700">
                            [{sec.totalSectionMarks} Marks]
                          </span>
                        </div>

                        {/* Section Instruction */}
                        {sec.instruction && (
                          <p className="text-xs italic text-slate-600 font-sans">
                            {sec.instruction}
                          </p>
                        )}

                        {/* Questions */}
                        <div className="space-y-4 pl-1">
                          {sec.questions.map((q, qIndex) => {
                            const isLabelTheDiagram = q.type === 'label_the_diagram' || q.type === 'label-the-diagram' || Boolean(q.labels_answer_key);

                            return (
                              <div key={q.id || qIndex} className="space-y-1.5 text-xs text-slate-900 break-inside-avoid">
                                
                                {/* Question statement & marks */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-1.5 flex-1">
                                    <span className="font-bold shrink-0 font-sans">
                                      Q{q.number || qIndex + 1}.
                                    </span>
                                    <div className="flex-1 leading-relaxed">
                                      <span>{q.text || q.question}</span>

                                      {/* MCQ Options (4 options) */}
                                      {q.options && q.options.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 font-sans">
                                          {q.options.map((opt, optIdx) => (
                                            <div
                                              key={optIdx}
                                              className={`px-2.5 py-1 rounded border text-[11px] ${
                                                showTeacherSolutions && opt === q.answer
                                                  ? 'bg-emerald-100 border-emerald-500 font-bold text-emerald-900'
                                                  : 'bg-slate-50 border-slate-200'
                                              }`}
                                            >
                                              <span className="font-bold mr-1">({String.fromCharCode(65 + optIdx)})</span>
                                              <span>{opt}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* DIAGRAM WITH NUMBERED POINTERS */}
                                      {q.imageUrl && (
                                        <DiagramWithPointers
                                          imageUrl={q.imageUrl}
                                          caption={q.figureCaption}
                                          labelsAnswerKey={q.labels_answer_key}
                                          isLabelTheDiagram={isLabelTheDiagram}
                                          showAnswers={showTeacherSolutions}
                                          questionNumber={q.number || qIndex + 1}
                                        />
                                      )}

                                      {/* Sub-questions if present */}
                                      {q.subQuestions && q.subQuestions.length > 0 && (
                                        <div className="space-y-1 mt-1 pl-2 font-sans text-[11px] text-slate-800">
                                          {q.subQuestions.map((subQ, subIdx) => (
                                            <div key={subIdx}>{subQ}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <span className="font-bold font-sans text-slate-700 shrink-0">
                                    [{q.marks}M]
                                  </span>
                                </div>

                                {/* TEACHER SOLUTION & RUBRIC (Visible when Answer Key is toggled ON) */}
                                {showTeacherSolutions && (
                                  <div className="mt-2 ml-5 p-2.5 bg-emerald-50 border-l-4 border-emerald-600 rounded text-[11px] font-sans text-emerald-950 space-y-1 shadow-sm">
                                    <div>
                                      <strong className="text-emerald-850">Answer / Solution:</strong>{' '}
                                      <span>{q.answer || q.solution || 'Direct curriculum observation and factual analysis.'}</span>
                                    </div>
                                    {q.explanation && (
                                      <div className="text-[10px] text-emerald-800 italic">
                                        <strong>Explanation:</strong> {q.explanation}
                                      </div>
                                    )}
                                    {q.markingScheme && (
                                      <div className="text-[10px] text-emerald-900 font-mono">
                                        <strong>Marking Rubric:</strong> {q.markingScheme}
                                      </div>
                                    )}
                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* End of Question Paper marker */}
                  <div className="text-center pt-8 border-t border-slate-300 font-sans text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                    *** End of Question Paper ***
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Bottom Floating Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Done reviewing?</span>
              <span className="text-xs text-slate-400">You can print directly to A4, export to Microsoft Word, or download as PDF.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerBrowserPrint()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Paper</span>
              </button>

              <button
                type="button"
                onClick={() => downloadPaperAsWord(displayPaper, headerConfig)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Word (.doc)</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewPaper}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Create Another Paper</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* FULL PAGE ZOOM MODAL (150 DPI) */}
      {previewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white">
                pdf ({previewPage.pageNumber}) Full View (150 DPI)
              </span>
              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              {previewPage.dataUrl ? (
                <img
                  src={previewPage.dataUrl}
                  alt={`Page ${previewPage.pageNumber}`}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg border border-slate-800 shadow"
                />
              ) : (
                <div className="p-6 bg-white text-slate-900 font-serif whitespace-pre-wrap rounded-lg max-w-xl text-xs leading-relaxed">
                  {previewPage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE FIGURE PREVIEW MODAL */}
      {activeFigurePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Figure on Page {activeFigurePreview.page}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveFigurePreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {activeFigurePreview.imageUrl && (
              <div className="p-2 bg-white rounded-xl border border-slate-300 flex items-center justify-center">
                <img
                  src={activeFigurePreview.imageUrl}
                  alt={activeFigurePreview.caption}
                  className="max-h-64 object-contain rounded"
                />
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-white">{activeFigurePreview.caption}</h4>
              {activeFigurePreview.labels_present && activeFigurePreview.labels_present.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeFigurePreview.labels_present.map((lbl, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {lbl}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TEACHER TOPIC MODAL */}
      {isCustomTopicModalOpen && (
        <CustomTopicModal
          isOpen={isCustomTopicModalOpen}
          onClose={() => setIsCustomTopicModalOpen(false)}
          activePageNumber={activePageNumber}
          chapters={docState.chapters || []}
          pages={docState.pages || []}
          onAddCustomTopic={handleAddCustomTopic}
        />
      )}

      {/* GEMINI API KEY MODAL */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          setIsApiKeyModalOpen(false);
          fetchApiConfig().then((cfg) => {
            if (cfg && cfg.hasApiKey) {
              setHasApiKey(true);
            }
          });
        }}
      />

    </div>
  );
}
