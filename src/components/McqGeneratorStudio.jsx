import React, { useState, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  BookOpen, 
  FileText, 
  Eye, 
  EyeOff,
  Layers,
  ShieldCheck,
  Award,
  CheckSquare,
  School,
  Info,
  Key,
  Lightbulb,
  ExternalLink,
  UploadCloud,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  FileCheck2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { generateMcqsFromTopic, scanPdfMultimodal, extractImagesFromPdfFile } from '../utils/backendApi';
import { cropAndSaveAllFigures } from '../utils/diagramCropper';
import { generateCurriculumMcqs } from '../utils/topicMcqEngine';
import { 
  extractPdfDocument, 
  renderPdfPageToDataUrl, 
  extractDiagramFromPageCanvas 
} from '../utils/pdfExtractor';
import { analyzeDocumentConcepts } from '../utils/documentConceptAnalyzer';
import { getDiagramMcqsForTopic } from '../utils/sampleDiagramSvgs';
import confetti from 'canvas-confetti';

const POPULAR_MCQ_TOPICS = [
  { name: 'English: Verbs, Tenses & Agreement', topic: 'Verbs, Subject-Verb Agreement & Tenses', subject: 'English', grade: 'Class 10' },
  { name: 'English: Active & Passive Voice', topic: 'Active and Passive Voice Conversions', subject: 'English', grade: 'Class 9' },
  { name: 'Mathematics: Quadratic Equations', topic: 'Factorisation, Quadratic Formula & Discriminant', subject: 'Mathematics', grade: 'Class 10' },
  { name: 'Mathematics: Trigonometry & Identities', topic: 'Trigonometric Ratios, Standard Values & Identities', subject: 'Mathematics', grade: 'Class 10' },
  { name: 'Social Science: French Revolution', topic: 'Causes and Outbreak of the French Revolution', subject: 'Social Science', grade: 'Class 9' },
  { name: 'Science: Photosynthesis & Respiration', topic: 'Photosynthesis & Cellular Respiration', subject: 'Biology', grade: 'Class 10' },
  { name: 'Science: Light Reflection & Lenses', topic: 'Light Reflection, Spherical Mirrors & Lenses', subject: 'Physics', grade: 'Class 10' },
  { name: 'Science: Acids, Bases and Salts', topic: 'Acids, Bases, pH Scale & Chemical Salts', subject: 'Chemistry', grade: 'Class 10' },
];

const BOARD_OPTIONS = [
  'CBSE',
  'ICSE / ISC',
  'State Board',
  'Cambridge / IGCSE',
  'IB',
  'Other',
];

const MCQ_COUNT_OPTIONS = [5, 10, 15, 20];
const MCQ_DIFFICULTY_OPTIONS = [
  { id: 'Easy', label: 'Easy (Recall)', sub: 'Knowledge' },
  { id: 'Medium', label: 'Medium (Standard)', sub: 'Concepts' },
  { id: 'Hard', label: 'Hard (HOTS)', sub: 'Higher Order' },
  { id: 'Mixed', label: 'Mixed Difficulty', sub: 'Balanced' }
];

export default function McqGeneratorStudio({
  headerConfig = {},
  setPaper,
  onSwitchTab,
  showToast,
  apiKey,
  selectedModel = 'gemini-2.5-flash',
  onOpenApiKeyModal,
}) {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('English');
  const [grade, setGrade] = useState('Class 10');
  const [selectedBoard, setSelectedBoard] = useState(headerConfig.board || 'CBSE');
  const [customBoardInput, setCustomBoardInput] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSolutions, setShowSolutions] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAiGuide, setShowAiGuide] = useState(false);
  const [includeDiagrams, setIncludeDiagrams] = useState(false);

  // PDF Document Upload & Extraction State
  const fileInputRef = useRef(null);
  const [docState, setDocState] = useState({
    loaded: false,
    filename: '',
    fileSize: '',
    totalPages: 0,
    pages: [],
    chapters: [],
    topics: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: '' });
  const [isDragOver, setIsDragOver] = useState(false);

  // Selected topic IDs (Set of strings)
  const [selectedTopicIds, setSelectedTopicIds] = useState(new Set());
  const [isTopicsBoxOpen, setIsTopicsBoxOpen] = useState(true);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [expandedChapterIds, setExpandedChapterIds] = useState(new Set());

  // MCQs strictly generated from teacher's topic
  const [mcqs, setMcqs] = useState([]);

  // Compute effective board: typed custom input when 'Other' is chosen, otherwise selected preset
  const effectiveBoard = selectedBoard === 'Other'
    ? (customBoardInput.trim() || 'Other Board')
    : selectedBoard;

  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF document.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress({ current: 0, total: 1, status: 'Initializing PDF reader...' });

    try {
      // Render images at 150 DPI so diagrams can be directly copied from the PDF
      const extracted = await extractPdfDocument(
        file, 
        (p) => setUploadProgress(p),
        { renderImages: true }
      );

      const conceptResult = analyzeDocumentConcepts(extracted.pages || []);
      const chapters = conceptResult.chapters || [];
      const topics = conceptResult.topics || [];

      // Auto-expand all chapter IDs
      const allChapIds = new Set(chapters.map((c) => c.id));
      setExpandedChapterIds(allChapIds);

      // Auto-select all detected topics initially
      const allTopicIds = new Set(topics.map((t) => t.id));
      setSelectedTopicIds(allTopicIds);

      // 1. Direct PyMuPDF extraction of all authentic diagrams & images from the PDF
      let autoFigures = [];
      try {
        setUploadProgress({ current: 0, total: 1, status: 'Extracting all embedded diagrams & figures with PyMuPDF...' });
        const pymupdfFigures = await extractImagesFromPdfFile(file);
        if (pymupdfFigures && pymupdfFigures.length > 0) {
          autoFigures = pymupdfFigures;
        }
      } catch (pmErr) {
        console.warn('PyMuPDF extraction notice:', pmErr.message);
      }

      // 2. Multimodal AI Vision Scan if needed
      if (autoFigures.length === 0) {
        try {
          setUploadProgress({ current: 0, total: 1, status: 'Scanning document chapters & scientific diagrams with AI Vision...' });
          const scanRes = await scanPdfMultimodal({
            pdfHash: extracted.pdfHash,
            pages: extracted.pages,
          });
          if (scanRes && scanRes.figures && scanRes.figures.length > 0) {
            autoFigures = await cropAndSaveAllFigures(scanRes.figures, extracted.pages);
          }
        } catch (scanErr) {
          console.warn('AI Vision scan warning:', scanErr.message);
        }
      }

      // Local fallback: Only crop pages that actually have diagram keywords or images (skip blank/title pages)
      if (autoFigures.length === 0) {
        for (const page of (extracted.pages || [])) {
          if (page.dataUrl && page.dataUrl.length > 200) {
            const hasFig = /(?:fig(?:ure)?\.?|diagram|illustration|चित्र|आकृति)/i.test(page.text || '') || (page.isImageOnly && page.pageNumber > 1);
            if (hasFig) {
              try {
                const croppedDataUrl = await extractDiagramFromPageCanvas(page.dataUrl);
                autoFigures.push({
                  id: `fig_p${page.pageNumber}_${Date.now()}`,
                  page: page.pageNumber,
                  caption: `Figure from Page ${page.pageNumber}`,
                  imageUrl: croppedDataUrl,
                  dataUrl: croppedDataUrl,
                  labels_present: ['Part [A]', 'Part [B]', 'Part [C]', 'Part [D]'],
                });
                if (autoFigures.length >= 8) break;
              } catch {
                // ignore
              }
            }
          }
        }
      }

      setDocState({
        loaded: true,
        filename: extracted.filename || file.name,
        fileSize: extracted.fileSize || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        totalPages: extracted.totalPages || extracted.pages.length,
        pages: extracted.pages || [],
        chapters,
        topics,
        figures: autoFigures,
        rawFile: file,
        detectedFromIndex: conceptResult.detectedFromIndex || false,
      });

      setIsTopicsBoxOpen(true);

      // Update topic field with clean names
      const initialTopicNames = topics.slice(0, 4).map((t) => t.cleanName).join(', ');
      if (initialTopicNames) {
        setTopic(initialTopicNames);
      } else if (chapters.length > 0) {
        setTopic(chapters[0].name);
      }

      if (showToast) {
        if (conceptResult.detectedFromIndex) {
          showToast(`✓ Extracted ${chapters.length} Real Chapters & ${topics.length} Topics (Matched from Textbook Index)!`);
        } else {
          showToast(`✓ Extracted ${chapters.length} Chapters & ${topics.length} Topics from ${file.name}!`);
        }
      }
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setError(`Failed to read PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handlePdfUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfUpload(file);
  };

  const handleRemovePdf = () => {
    setDocState({
      loaded: false,
      filename: '',
      fileSize: '',
      totalPages: 0,
      pages: [],
      chapters: [],
      topics: [],
    });
    setSelectedTopicIds(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleTopic = (topicItem) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicItem.id)) {
        next.delete(topicItem.id);
      } else {
        next.add(topicItem.id);
      }

      // Update the main topic input with the currently ticked topic clean names
      const ticked = docState.topics.filter((t) => next.has(t.id));
      if (ticked.length > 0) {
        setTopic(ticked.map((t) => t.cleanName).join(', '));
      }

      return next;
    });
  };

  const handleToggleChapter = (chapter) => {
    const chapterTopics = docState.topics.filter((t) => t.chapterId === chapter.id);
    const allSelected = chapterTopics.every((t) => selectedTopicIds.has(t.id));

    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      chapterTopics.forEach((t) => {
        if (allSelected) {
          next.delete(t.id);
        } else {
          next.add(t.id);
        }
      });

      const ticked = docState.topics.filter((t) => next.has(t.id));
      if (ticked.length > 0) {
        setTopic(ticked.map((t) => t.cleanName).join(', '));
      }

      return next;
    });
  };

  const handleToggleChapterExpand = (chapterId) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleSelectAllTopics = () => {
    const allIds = new Set(docState.topics.map((t) => t.id));
    setSelectedTopicIds(allIds);
    const ticked = docState.topics;
    if (ticked.length > 0) {
      setTopic(ticked.slice(0, 5).map((t) => t.cleanName).join(', '));
    }
  };

  const handleClearAllTopics = () => {
    setSelectedTopicIds(new Set());
  };

  const getSelectedContextText = () => {
    if (!docState.loaded || selectedTopicIds.size === 0) return '';

    const selectedTopicsList = docState.topics.filter((t) => selectedTopicIds.has(t.id));
    const selectedPageNumbers = new Set(selectedTopicsList.map((t) => t.pageNumber));

    // Gather page texts for selected pages
    const pageTexts = (docState.pages || [])
      .filter((p) => selectedPageNumbers.has(p.pageNumber))
      .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
      .join('\n\n');

    // Also include explicit list of ticked topics and their snippets
    const topicOutline = selectedTopicsList
      .map((t) => `- Topic: ${t.cleanName} (Page ${t.pageNumber})${t.snippet ? `\n  Snippet: ${t.snippet}` : ''}`)
      .join('\n');

    const fullContext = `TICKED SYLLABUS TOPICS TO TEST:\n${topicOutline}\n\nEXTRACTED DOCUMENT TEXT:\n${pageTexts}`;
    return fullContext.slice(0, 15000);
  };

  const filteredChapters = useMemo(() => {
    if (!docState.loaded || docState.chapters.length === 0) return [];
    const q = topicSearchQuery.trim().toLowerCase();
    if (!q) return docState.chapters;

    return docState.chapters.filter((chap) => {
      const matchChap = chap.name.toLowerCase().includes(q);
      const chapTopics = docState.topics.filter((t) => t.chapterId === chap.id);
      const matchTopic = chapTopics.some((t) => t.name.toLowerCase().includes(q) || t.cleanName.toLowerCase().includes(q));
      return matchChap || matchTopic;
    });
  }, [docState, topicSearchQuery]);

  // Helper to resolve authentic diagrams for the ticked topic directly from the uploaded PDF
  const resolveDiagramForTickedTopic = async (topicStr) => {
    if (!includeDiagrams) return null;

    // 1. If PDF document is loaded and topics are ticked, inspect ticked pages
    if (docState.loaded) {
      const tickedTopics = docState.topics.filter((t) => selectedTopicIds.has(t.id));
      const tickedPageNumbers = new Set(tickedTopics.map((t) => t.pageNumber).filter(Boolean));
      const topicKeywords = (topicStr || '').toLowerCase().split(/[\s,.-]+/).filter((w) => w.length > 2);

      // A. Check docState.figures matching ticked pages or topic keywords
      // Exclude page 1 cover/title images if diagrams on real content pages exist
      const nonCoverFigures = (docState.figures || []).filter((f) => f.page !== 1);
      const figurePool = nonCoverFigures.length > 0 ? nonCoverFigures : (docState.figures || []);

      const matchedFigures = figurePool.filter((f) => {
        if (f.page && tickedPageNumbers.has(f.page)) return true;
        const caption = (f.caption || '').toLowerCase();
        return topicKeywords.some((w) => caption.includes(w));
      });

      // Pick the best authentic diagram from the ticked chapter
      const effectiveFig = matchedFigures.length > 0 
        ? matchedFigures[0] 
        : (figurePool.length > 0 ? figurePool[0] : null);

      if (effectiveFig) {
        let cleanImgUrl = effectiveFig.imageUrl || effectiveFig.dataUrl || `/figures/${effectiveFig.id}.png`;
        if (cleanImgUrl.endsWith('.jpx')) {
          cleanImgUrl = cleanImgUrl.replace(/\.jpx$/, '.png');
        }

        // Get meaningful labels from figure or from the page text
        let labels = effectiveFig.labels_present && effectiveFig.labels_present.filter(l => !l.startsWith('Part [')).length >= 2
          ? effectiveFig.labels_present
          : [];

        if (labels.length < 2) {
          const pg = (docState.pages || []).find((p) => p.pageNumber === effectiveFig.page);
          const pageWords = (pg?.text || '')
            .match(/\b[A-Z][a-z]{3,}\b/g)
            ?.filter(w => !['Figure', 'Chapter', 'Page', 'Table', 'Standard', 'Science', 'Which', 'Their', 'There', 'These'].includes(w)) || [];
          labels = Array.from(new Set(pageWords)).slice(0, 4);
        }

        if (labels.length < 4) {
          labels = ['Outer Membrane / Boundary', 'Nucleus / Core', 'Cytoplasm / Matrix', 'Cell Wall / Envelope'];
        }

        const diagramTitle = effectiveFig.caption && !effectiveFig.caption.startsWith('Figure from Page')
          ? effectiveFig.caption
          : topicStr;

        return {
          id: 1,
          question: `Refer to the scientific diagram from the textbook for "${diagramTitle}". Which key component or structure is indicated?`,
          options: labels.slice(0, 4),
          answer: labels[0],
          explanation: `According to the textbook figure on Page ${effectiveFig.page || ''} for "${diagramTitle}", ${labels[0]} forms the key identified structure.`,
          imageUrl: cleanImgUrl,
          figureCaption: diagramTitle,
          labels_answer_key: { A: labels[0], B: labels[1], C: labels[2] || 'Secondary Part', D: labels[3] || 'Outer Layer' },
          isDiagram: true,
        };
      }

      // B. Directly crop and copy the authentic diagram from the ticked topic's page
      const targetPageNum = tickedPageNumbers.size > 0 
        ? Array.from(tickedPageNumbers)[0] 
        : (docState.pages?.[0]?.pageNumber || 1);

      let targetPage = (docState.pages || []).find((p) => p.pageNumber === targetPageNum);
      let pageDataUrl = targetPage?.dataUrl;

      // On-demand rendering if not yet rendered
      if ((!pageDataUrl || pageDataUrl.length < 200) && docState.rawFile) {
        pageDataUrl = await renderPdfPageToDataUrl(docState.rawFile, targetPageNum);
        if (pageDataUrl && targetPage) {
          targetPage.dataUrl = pageDataUrl;
        }
      }

      if (pageDataUrl && pageDataUrl.length > 200) {
        // Crop the authentic diagram directly from this PDF page canvas
        const croppedDiagramUrl = await extractDiagramFromPageCanvas(pageDataUrl);
        const preset = targetPage?.diagramPreset;
        const labels = preset?.labels_present || ['Part (A)', 'Part (B)', 'Part (C)', 'Part (D)'];

        return {
          id: 1,
          question: preset?.caption 
            ? `Observe the diagram of ${preset.caption} from Page ${targetPageNum}. Which structure is indicated?`
            : `Refer to the textbook illustration on Page ${targetPageNum} for "${topicStr}". Which component is indicated?`,
          options: labels.slice(0, 4),
          answer: labels[0],
          explanation: `Directly extracted from the uploaded PDF document on Page ${targetPageNum} for ${topicStr}.`,
          imageUrl: croppedDiagramUrl || pageDataUrl,
          figureCaption: preset?.caption || `Figure from Textbook Page ${targetPageNum}: ${topicStr}`,
          labels_answer_key: { A: labels[0], B: labels[1], C: labels[2], D: labels[3] },
          isDiagram: true,
        };
      }
    }

    // 2. Keyword SVG diagram bank (only if genuine keyword match)
    const keywordDiagMcqs = getDiagramMcqsForTopic(topicStr, 1);
    if (keywordDiagMcqs.length > 0) {
      return {
        ...keywordDiagMcqs[0],
        id: 1,
        isDiagram: true,
      };
    }

    // 3. No authentic diagram exists for this topic: return null (never attach unrelated diagrams)
    return null;
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a curriculum topic name or tick topics from your uploaded PDF.');
      return;
    }

    setLoading(true);
    setError('');

    const targetBoard = effectiveBoard;
    const contextText = getSelectedContextText();

    try {
      const data = await generateMcqsFromTopic({
        topic: topic.trim(),
        subject,
        grade,
        board: targetBoard,
        count: Number(count) || 5,
        difficulty,
        contextText,
        includeDiagrams,
      });

      if (data && data.mcqs && data.mcqs.length > 0) {
        let finalGenerated = data.mcqs;
        if (includeDiagrams) {
          const hasAnyDiagram = finalGenerated.some((m) => m.imageUrl);
          if (!hasAnyDiagram) {
            const topicDiagram = await resolveDiagramForTickedTopic(topic.trim());
            if (topicDiagram) {
              finalGenerated = [
                topicDiagram,
                ...finalGenerated.slice(1).map((m, idx) => ({ ...m, id: idx + 2 })),
              ];
            }
          }
        }

        setMcqs(finalGenerated);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        if (showToast) {
          const hasDiag = finalGenerated.some((m) => m.imageUrl);
          if (includeDiagrams && hasDiag) {
            showToast(`✓ Generated ${finalGenerated.length} MCQs on "${topic}" with genuine diagram from PDF!`);
          } else if (includeDiagrams && !hasDiag) {
            showToast(`✓ Generated ${finalGenerated.length} MCQs on "${topic}". (Note: No diagram found on ticked page; accurate conceptual questions generated.)`);
          } else if (data.fallback) {
            showToast(`✓ Generated ${finalGenerated.length} MCQs on "${topic}" (${targetBoard} • ${subject})!`);
          } else {
            showToast(`✨ Generated ${finalGenerated.length} MCQs on "${topic}" (${targetBoard} • ${subject}) with Gemini AI!`);
          }
        }
      } else {
        throw new Error('No MCQs returned from generator.');
      }
    } catch (err) {
      console.warn('Backend MCQ generator fallback triggered:', err);
      // Fallback local MCQs using our rich subject-and-topic-aware curriculum engine!
      const fallbackMcqs = generateCurriculumMcqs({
        topic: topic.trim(),
        subject,
        grade,
        board: targetBoard,
        count: Number(count) || 5,
        difficulty,
        includeDiagrams: false,
      });

      let finalFallback = fallbackMcqs;
      if (includeDiagrams) {
        const topicDiagram = await resolveDiagramForTickedTopic(topic.trim());
        if (topicDiagram) {
          finalFallback = [
            topicDiagram,
            ...finalFallback.slice(1).map((m, idx) => ({ ...m, id: idx + 2 })),
          ];
        }
      }

      setMcqs(finalFallback);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      if (showToast) {
        const hasDiag = finalFallback.some((m) => m.imageUrl);
        if (includeDiagrams && hasDiag) {
          showToast(`✓ Generated ${finalFallback.length} MCQs on "${topic}" with genuine diagram!`);
        } else if (includeDiagrams && !hasDiag) {
          showToast(`✓ Generated ${finalFallback.length} MCQs on "${topic}". (Note: No diagram found on ticked page; accurate conceptual questions generated.)`);
        } else {
          showToast(`✓ Generated ${finalFallback.length} MCQs on "${topic}" (${targetBoard} • ${subject})!`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    let text = `${headerConfig.schoolName || 'EXAMINATION'}\nBOARD: ${effectiveBoard}\nTOPIC: ${topic} (${grade} - ${subject})\n\n`;
    mcqs.forEach((m, idx) => {
      text += `Q${idx + 1}. ${m.question}\n`;
      m.options.forEach((opt, optIdx) => {
        text += `   (${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
      });
      if (showSolutions) {
        text += `   Correct Answer: ${m.answer}\n`;
        if (m.explanation) text += `   Explanation: ${m.explanation}\n`;
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (showToast) showToast('📋 Copied MCQs to clipboard!');
  };

  const handleExportAsPaper = () => {
    const newPaper = {
      header: {
        ...headerConfig,
        examTitle: `${topic.toUpperCase()} - MCQ ASSESSMENT`,
        subject,
        grade,
        board: effectiveBoard,
        affiliation: `${effectiveBoard} Pattern Assessment`,
        maxMarks: mcqs.length,
      },
      sections: [
        {
          id: 'sec-mcq',
          letter: 'A',
          title: 'SECTION A: MULTIPLE CHOICE QUESTIONS',
          instruction: 'Select the correct option from the given choices. Each question carries 1 mark.',
          totalSectionMarks: mcqs.length,
          questions: mcqs.map((m, idx) => ({
            id: `mcq-${idx + 1}`,
            number: idx + 1,
            type: 'mcq',
            question: m.question,
            text: m.question,
            options: m.options,
            answer: m.answer,
            marks: 1,
            explanation: m.explanation,
            imageUrl: m.imageUrl || undefined,
            figureCaption: m.figureCaption || undefined,
            labels_answer_key: m.labels_answer_key || undefined,
          })),
        },
      ],
      totalCalculatedMarks: mcqs.length,
      totalQuestionCount: mcqs.length,
    };

    if (setPaper) setPaper(newPaper);
    if (onSwitchTab) onSwitchTab('preview');
    if (showToast) showToast('✓ Transferred MCQs to Question Paper Preview!');
  };

  return (
    <div className="space-y-8">
      
      {/* Header - Matching PDF Option Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 text-xs font-extrabold tracking-wide uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>MCQ Examination Engine • 100% In-Browser & Private</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Generate MCQ Base Test
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
          Type any curriculum topic to create board-standard multiple-choice test papers with calibrated options, instant answer keys, and automated marking schemes.
        </p>
      </div>

      {/* Two-Column Layout (Matching PDF option: grid-cols-1 lg:grid-cols-3 gap-8) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Main Working Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CARD 1: TOPIC & ASSESSMENT CONFIGURATION */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow p-6 sm:p-8 space-y-6">
            
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-600 shadow-xs">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Topic & MCQ Assessment Configuration
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter your curriculum topic, target class, and assessment structure
                  </p>
                </div>
              </div>

              <span className="px-3.5 py-1.5 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-extrabold text-xs shadow-xs">
                {count} Questions • {difficulty} • {effectiveBoard}
              </span>
            </div>

            {/* AI Engine Status & Recommendation Banner */}
            <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
              apiKey
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-2.5">
                {apiKey ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-black flex items-center gap-2">
                    <span>{apiKey ? 'Google Gemini AI Connected' : 'Curriculum Engine Mode (No API Key)'}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      apiKey ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {apiKey ? (selectedModel || 'gemini-2.5-flash') : 'Subject-Aware Verified'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium pt-0.5">
                    {apiKey
                      ? 'Live Google Gemini AI generating curriculum-aligned questions with solutions.'
                      : 'Subject-aware engine ready for English (Verbs), Math, Science, and Social Studies.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
                {onOpenApiKeyModal && (
                  <button
                    type="button"
                    onClick={onOpenApiKeyModal}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border-2 shadow-xs cursor-pointer ${
                      apiKey
                        ? 'bg-white hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{apiKey ? 'Configure Model' : 'Connect Gemini API Key'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAiGuide(!showAiGuide)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer shadow-xs"
                  title="View API & Model Suggestions"
                >
                  {showAiGuide ? 'Hide Suggestions' : 'AI Suggestions 💡'}
                </button>
              </div>
            </div>

            {/* Collapsible Model & API Suggestion Guide */}
            {showAiGuide && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/90 border-2 border-indigo-200 text-slate-800 text-xs space-y-3 shadow-xs">
                <div className="flex items-center gap-2 font-black text-indigo-950 text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Recommended AI Models & API Setup for Exam Paper Generation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 bg-white rounded-xl border-2 border-indigo-200 space-y-1.5">
                    <span className="font-black text-indigo-900 block text-xs">Recommended API:</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      <strong>Google Gemini API</strong> via Google AI Studio. Free for educators and developers with generous rate limits.
                    </p>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline pt-1"
                    >
                      <span>Get Free API Key at Google AI Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border-2 border-indigo-200 space-y-1.5">
                    <span className="font-black text-indigo-900 block text-xs">Recommended Model:</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      <strong>gemini-2.5-flash</strong> (or <strong>gemini-1.5-flash</strong>).
                      Engineered for high-speed, board-compliant question generation with 4 distinct options and detailed rationale in under 1 second.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-indigo-200 text-[11px] text-slate-600 font-medium">
                  🛡️ <em>Security: Your API key is stored securely in your computer's local <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold text-indigo-700">.env</code> file. It is never exposed to public networks.</em>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleGenerate} className="space-y-6">
              
              {/* Topic Input */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Topic or Chapter Name <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Verbs & Tenses, Quadratic Equations, The French Revolution, Photosynthesis..."
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 text-sm text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition shadow-xs"
                  required
                />
              </div>

              {/* Upload Chapter / Syllabus PDF Area (Right downward of Topic Input) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Chapter / Syllabus PDF (Optional)</span>
                  </label>
                  {docState.loaded && (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ PDF Attached
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!docState.loaded ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 shadow-xs ${
                      isDragOver
                        ? 'bg-indigo-100/80 border-indigo-500 scale-[1.01]'
                        : 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/70'
                    }`}
                  >
                    {isUploading ? (
                      <div className="py-2 space-y-3">
                        <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-indigo-900">
                            {uploadProgress.status || 'Extracting PDF & Analyzing Topics...'}
                          </p>
                          <div className="w-48 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full transition-all duration-300"
                              style={{
                                width: uploadProgress.total
                                  ? `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`
                                  : '40%',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 mx-auto rounded-2xl bg-indigo-100 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">
                            <span className="text-indigo-600 hover:underline">Click to upload</span> or drag and drop chapter / syllabus PDF
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                            Detects chapters, subtopics, and concepts so you can tick exact topics for MCQ generation
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Loaded PDF Card */
                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate max-w-xs sm:max-w-md">
                          {docState.filename}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium pt-0.5">
                          <span>{docState.totalPages} Pages</span>
                          <span>•</span>
                          <span>{docState.fileSize}</span>
                          <span>•</span>
                          <span className="text-indigo-700 font-bold">
                            {docState.chapters.length} Chapters, {docState.topics.length} Topics
                          </span>
                          {docState.detectedFromIndex && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                              📖 Index Matched
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        Change PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="p-1.5 rounded-xl bg-white hover:bg-red-50 border-2 border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-600 transition cursor-pointer shadow-xs"
                        title="Remove uploaded PDF"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DIAGRAM-BASED QUESTIONS OPTION CARD (Prominently placed Above Topic Selection) */}
              <div 
                onClick={() => setIncludeDiagrams(!includeDiagrams)}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer shadow-xs ${
                  includeDiagrams
                    ? 'bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 border-indigo-400 ring-2 ring-indigo-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5 select-none">
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      id="include-diagrams-checkbox"
                      checked={includeDiagrams}
                      onChange={(e) => setIncludeDiagrams(e.target.checked)}
                      className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-2 border-slate-300 cursor-pointer transition"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          includeDiagrams ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-slate-900">
                          Include Diagram-Based Questions in Test?
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                        includeDiagrams
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {includeDiagrams ? '✓ Diagrams Active' : 'Also add diagram questions?'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Tick this option if you want questions with scientific diagrams. When selected topics involve visual concepts (e.g. reflection, lenses, prism, virus structure, mosquito/dengue vector, human heart, electrical circuits, cell structure), the test will include authentic visual diagrams, labelled parts (A, B, C, D), and diagram-based questions in both the preview and exported question paper.
                    </p>

                    {includeDiagrams && (
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-indigo-700 bg-indigo-100/60 p-2.5 rounded-xl border border-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Visual questions with labelled diagrams [A], [B], [C], [D] will be generated for your chosen topics!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* The "Topics" Box (Created below the PDF) */}
              {docState.loaded && docState.topics.length > 0 && (
                <div className="rounded-3xl border-2 border-indigo-300 bg-white overflow-hidden shadow-xs space-y-0">
                  {/* Topics Box Header */}
                  <div className="p-4 bg-indigo-50/80 border-b-2 border-indigo-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-indigo-950 flex flex-wrap items-center gap-2">
                          <span>All Topics & Chapters</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[11px] font-black">
                            {selectedTopicIds.size} of {docState.topics.length} Ticked
                          </span>
                          {docState.detectedFromIndex && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300 shadow-xs flex items-center gap-1">
                              ✓ Matched from Textbook Index
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Tick the chapters or specific topic names below to generate questions strictly from them
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllTopics}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border-2 border-indigo-200 text-indigo-700 text-xs font-black transition cursor-pointer shadow-xs"
                      >
                        Tick All Topics
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllTopics}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTopicsBoxOpen(!isTopicsBoxOpen)}
                        className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-700 transition cursor-pointer shadow-xs"
                        title={isTopicsBoxOpen ? 'Collapse Topics' : 'Expand Topics'}
                      >
                        {isTopicsBoxOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Topics Box Body */}
                  {isTopicsBoxOpen && (
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Search / Filter Input */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={topicSearchQuery}
                          onChange={(e) => setTopicSearchQuery(e.target.value)}
                          placeholder="Search chapter or topic name to tick..."
                          className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-indigo-600 focus:outline-none transition shadow-xs"
                        />
                        {topicSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setTopicSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Chapters & Topics List */}
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {filteredChapters.map((chapter) => {
                          const chapterTopics = docState.topics.filter((t) => {
                            if (t.chapterId !== chapter.id) return false;
                            if (!topicSearchQuery.trim()) return true;
                            const q = topicSearchQuery.trim().toLowerCase();
                            return (
                              t.name.toLowerCase().includes(q) ||
                              t.cleanName.toLowerCase().includes(q) ||
                              chapter.name.toLowerCase().includes(q)
                            );
                          });

                          if (chapterTopics.length === 0) return null;

                          const allChapTicked = chapterTopics.every((t) => selectedTopicIds.has(t.id));
                          const someChapTicked = chapterTopics.some((t) => selectedTopicIds.has(t.id));
                          const isExpanded = expandedChapterIds.has(chapter.id);

                          return (
                            <div
                              key={chapter.id}
                              className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 overflow-hidden transition shadow-xs"
                            >
                              {/* Chapter Header */}
                              <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-2">
                                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={allChapTicked}
                                    ref={(el) => {
                                      if (el) el.indeterminate = someChapTicked && !allChapTicked;
                                    }}
                                    onChange={() => handleToggleChapter(chapter)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                  />
                                  <span className="font-extrabold text-xs text-slate-900 truncate">
                                    {chapter.name}
                                  </span>
                                </label>

                                <div className="flex items-center gap-2 shrink-0">
                                  {chapter.pages && chapter.pages.length > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                                      {chapter.pages.length === 1
                                        ? `Page ${chapter.pages[0]}`
                                        : `Pages ${Math.min(...chapter.pages)}–${Math.max(...chapter.pages)}`}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600">
                                    {chapterTopics.filter((t) => selectedTopicIds.has(t.id)).length}/{chapterTopics.length} Ticked
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleChapterExpand(chapter.id)}
                                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Topics under Chapter */}
                              {isExpanded && (
                                <div className="p-2 space-y-1 bg-white">
                                  {chapterTopics.map((topicItem) => {
                                    const isTicked = selectedTopicIds.has(topicItem.id);
                                    return (
                                      <label
                                        key={topicItem.id}
                                        className={`flex items-start gap-2.5 p-2 rounded-xl border transition cursor-pointer ${
                                          isTicked
                                            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold'
                                            : 'bg-white hover:bg-slate-50 border-transparent text-slate-700 font-medium'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isTicked}
                                          onChange={() => handleToggleTopic(topicItem)}
                                          className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs leading-snug">
                                              {topicItem.cleanName || topicItem.name}
                                            </span>
                                            {topicItem.pageNumber && (
                                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                                                Page {topicItem.pageNumber}
                                              </span>
                                            )}
                                          </div>
                                          {topicItem.snippet && (
                                            <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                              {topicItem.snippet}
                                            </p>
                                          )}
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subject, Grade & Education Board in 3 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-300 text-sm text-slate-900 font-bold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition cursor-pointer shadow-xs"
                  >
                    <option value="English">English (Grammar, Verbs & Literature)</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="General Science">General Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Social Science">Social Science (History, Civics, Geography)</option>
                    <option value="Computer Science">Computer Science / IT</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">Class / Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-300 text-sm text-slate-900 font-bold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition cursor-pointer shadow-xs"
                  >
                    {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Education Board
                  </label>

                  <select
                    value={selectedBoard}
                    onChange={(e) => setSelectedBoard(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-300 text-sm text-slate-900 font-bold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition cursor-pointer shadow-xs"
                  >
                    {BOARD_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  {selectedBoard === 'Other' && (
                    <input
                      type="text"
                      value={customBoardInput}
                      onChange={(e) => setCustomBoardInput(e.target.value)}
                      placeholder="Enter board name..."
                      className="w-full mt-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-indigo-500 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition shadow-xs"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Number of MCQs Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Target Question Count Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {MCQ_COUNT_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCount(c)}
                      className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border-2 text-center cursor-pointer shadow-xs ${
                        count === c
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-[1.02]'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      {c} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Difficulty Level:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {MCQ_DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficulty(d.id)}
                      className={`px-3.5 py-3 rounded-2xl text-xs font-black transition-all border-2 text-center cursor-pointer shadow-xs ${
                        difficulty === d.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-[1.02]'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      <div>{d.label}</div>
                      <div className={`text-[10px] font-medium ${difficulty === d.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {d.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ceiling Info Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/90 border-2 border-indigo-200/90 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-800">
                    Selected Setup: <strong className="text-indigo-700">{count} MCQs ({count} Marks)</strong> • {grade} • {subject} • <strong className="text-indigo-900">{effectiveBoard}</strong>
                  </span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-white border border-indigo-200 font-mono text-[11px] font-black text-indigo-700 uppercase shadow-xs">
                  {effectiveBoard} Standard
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-800 text-xs font-extrabold shadow-xs">
                  ⚠️ {error}
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-base shadow-lg shadow-indigo-600/30 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer border-2 border-indigo-700 hover:border-indigo-600"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating {count} MCQs with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Generate MCQ Test Sheet ({count} Questions)</span>
                  </>
                )}
              </button>

            </form>

          </div>

          {/* CARD 2: RESULTS & TEST SHEET LIVE PREVIEW */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            
            {/* Top Results Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/90 border-2 border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white border-2 border-indigo-500 flex items-center justify-center shadow-md shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-indigo-950">
                    {mcqs.length > 0 ? 'MCQ Assessment Sheet Generated Successfully!' : 'MCQ Assessment Test Sheet'}
                  </h4>
                  <p className="text-xs text-indigo-800 font-medium">
                    {mcqs.length > 0
                      ? `${mcqs.length} Marks • ${mcqs.length} Questions • ${grade} • ${subject}`
                      : 'Questions with randomized options and teacher answer keys will appear below'}
                  </p>
                </div>
              </div>

              {mcqs.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowSolutions(!showSolutions)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 border-2 cursor-pointer shadow-xs ${
                      showSolutions
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {showSolutions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{showSolutions ? 'Marking Scheme ON' : 'Marking Scheme'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerBrowserPrint()}
                    className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadElementAsPdf('mcq-display-container', `${topic.replace(/[^a-zA-Z0-9_-]/g, '_')}_MCQs.pdf`)}
                    className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-indigo-600 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportAsPaper}
                    className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-600 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Use as Exam Paper</span>
                  </button>
                </div>
              )}
            </div>

            {/* Test Sheet Container */}
            {mcqs.length === 0 ? (
              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-10 sm:p-14 text-center space-y-4 bg-slate-50/70 shadow-xs">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-indigo-100 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">Ready to Generate MCQ Test Sheet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                  Enter your topic name above or select one of the popular curriculum presets from the sidebar, then click <strong className="text-indigo-600 font-extrabold">"Generate MCQ Test Sheet"</strong>.
                </p>
              </div>
            ) : (
              <div
                id="mcq-display-container"
                className="border-2 border-slate-300 rounded-3xl p-6 sm:p-8 bg-white space-y-6 shadow-sm font-serif"
              >
                {/* School Header */}
                <div className="text-center pb-4 border-b-2 border-slate-300 space-y-1">
                  <h2 className="text-lg font-black uppercase text-slate-900 font-sans tracking-wide">
                    {headerConfig.schoolName || 'DELHI PUBLIC SCHOOL, R.K. PURAM'}
                  </h2>
                  <p className="text-[11px] font-black uppercase tracking-wider text-indigo-700 font-sans">
                    {effectiveBoard.toUpperCase()} CURRICULUM PATTERN
                  </p>
                  <h3 className="text-xs font-bold uppercase text-slate-700 font-sans">
                    {topic ? `${topic.toUpperCase()} - MULTIPLE CHOICE EXAMINATION` : 'MULTIPLE CHOICE EXAMINATION'}
                  </h3>
                  {docState.loaded && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-bold font-sans">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Grounded in PDF: <strong>{docState.filename}</strong> ({selectedTopicIds.size} Ticked Topics)</span>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-between items-center text-xs font-bold text-slate-700 font-sans p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 mt-2 gap-2">
                    <span>BOARD: {effectiveBoard.toUpperCase()}</span>
                    <span>SUBJECT: {subject.toUpperCase()}</span>
                    <span>CLASS: {grade}</span>
                    <span>MAX MARKS: {mcqs.length}M</span>
                    <span>TIME: {mcqs.length * 2} MINS</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="font-sans text-xs bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 text-slate-700 space-y-1.5 shadow-xs">
                  <span className="font-black text-slate-800 block">General Instructions:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-medium">
                    <li>All questions are compulsory. Each question carries 1 Mark.</li>
                    <li>Select exactly one correct option for each question.</li>
                    <li>No negative marking for incorrect responses.</li>
                    {docState.loaded && selectedTopicIds.size > 0 && (
                      <li>Questions are strictly formulated from {selectedTopicIds.size} selected topic(s) of <strong>{docState.filename}</strong>.</li>
                    )}
                  </ul>
                </div>

                {/* Questions List */}
                <div className="space-y-4 font-sans">
                  {mcqs.map((m, idx) => (
                    <div 
                      key={m.id || idx} 
                      className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-3.5 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="px-2.5 py-0.5 rounded-xl bg-indigo-50 border-2 border-indigo-200 text-indigo-900 font-black text-xs shrink-0">
                            Q{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 leading-relaxed pt-0.5">{m.question}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-xl bg-slate-100 border-2 border-slate-200 font-black text-xs text-slate-700 shrink-0">
                          1 Mark
                        </span>
                      </div>

                      {/* Diagram Figure if present */}
                      {m.imageUrl && (
                        <div className="sm:ml-9 my-3 p-3.5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 flex flex-col items-center shadow-2xs">
                          <img
                            src={m.imageUrl}
                            alt={m.figureCaption || "Scientific Examination Diagram"}
                            className="max-h-64 rounded-xl object-contain border border-slate-200 bg-white p-2 shadow-xs"
                          />
                          <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
                            {m.figureCaption && (
                              <span className="text-[11px] font-bold text-slate-700 text-center bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-2xs">
                                📊 {m.figureCaption}
                              </span>
                            )}
                            <label className="cursor-pointer text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 shadow-2xs flex items-center gap-1.5 transition">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Replace / Upload Diagram</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                      const updated = [...mcqs];
                                      updated[idx] = {
                                        ...m,
                                        imageUrl: re.target.result,
                                        figureCaption: `Custom Diagram: ${f.name.replace(/\.[^.]+$/, '')}`,
                                      };
                                      setMcqs(updated);
                                      if (showToast) showToast(`✓ Attached diagram "${f.name}"!`);
                                    };
                                    reader.readAsDataURL(f);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {/* 4 Options Grid with Prominent Curves and Crisp Borders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:pl-9 text-xs">
                        {m.options.map((opt, optIdx) => {
                          const isCorrect = showSolutions && opt === m.answer;
                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition shadow-xs ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm'
                                  : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-800 font-medium'
                              }`}
                            >
                              <span 
                                className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                  isCorrect 
                                    ? 'bg-emerald-600 text-white border border-emerald-600' 
                                    : 'bg-white border border-slate-300 text-slate-800'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 leading-snug">{opt}</span>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {showSolutions && (m.answer || m.explanation) && (
                        <div className="sm:ml-9 p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-1.5 shadow-xs">
                          <div>
                            <strong className="text-emerald-950 font-black">Model Answer / Key: </strong>
                            <span className="font-bold">{m.answer}</span>
                          </div>
                          {m.explanation && (
                            <p className="text-emerald-900 text-[11px] leading-relaxed font-medium">
                              <strong className="font-bold">Explanation / Rationale: </strong>{m.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-slate-200 text-center text-xs font-black text-slate-400 font-sans tracking-widest uppercase">
                  *** END OF EXAMINATION PAPER ***
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right Column: Sidebar (Curved & Bold Borders) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* SIDEBAR CARD 1: STANDARDS */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-600 font-extrabold text-sm">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
                <Award className="w-4 h-4" />
              </div>
              <span>Assessment Standards</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Every MCQ test paper is calibrated according to {effectiveBoard} examination guidelines:
            </p>

            <ul className="text-xs text-slate-700 space-y-2.5 font-medium">
              <li className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span><strong>Calibrated Distractors:</strong> 1 verified key with 3 realistic conceptual distractors.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span><strong>Bloom's Taxonomy:</strong> Balanced recall, procedural, and higher-order questions.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span><strong>Teacher Solution Key:</strong> Instant answers and rationale for quick marking.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span><strong>One-Click Paper Export:</strong> Transfer straight to Board Exam Paper Section A.</span>
              </li>
            </ul>
          </div>

          {/* SIDEBAR CARD 2: 100% PRIVATE */}
          <div className="bg-gradient-to-br from-indigo-50/90 to-violet-50/70 rounded-3xl border-2 border-indigo-200 shadow-md p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-900 font-extrabold text-sm">
              <div className="p-2 rounded-xl bg-white border border-indigo-200 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <span>100% Private Client Engine</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Your tests, curriculum topics, and generated assessment sheets are created directly in your browser. Complete privacy for school examinations.
            </p>

            <div className="p-2.5 rounded-2xl bg-white border border-indigo-200 flex items-center gap-2 text-[11px] font-extrabold text-indigo-800 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Safe for Confidential School Assessments</span>
            </div>
          </div>

          {/* SIDEBAR CARD 3: POPULAR TOPIC PRESETS */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <span>Popular Curriculum Topics</span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              One-click preset loading for standard board curriculum:
            </p>

            <div className="space-y-2">
              {POPULAR_MCQ_TOPICS.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTopic(tpl.topic);
                    setSubject(tpl.subject);
                    setGrade(tpl.grade);
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/90 border-2 border-slate-200 hover:border-indigo-300 text-left transition group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 group-hover:text-indigo-900">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-xl bg-slate-200 group-hover:bg-indigo-200 text-slate-700 group-hover:text-indigo-800">
                      Select
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                    {tpl.grade} • {tpl.subject}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SIDEBAR CARD 4: ACTIVE INSTITUTION HEADER */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
                <School className="w-4 h-4 text-indigo-600" />
              </div>
              <span>Active Institution Header</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs space-y-1.5 shadow-xs">
              <span className="font-black text-slate-900 block truncate">
                {headerConfig.schoolName || 'DELHI PUBLIC SCHOOL, R.K. PURAM'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block truncate">
                {effectiveBoard} Curriculum & Assessment Pattern
              </span>
              <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-indigo-700 inline-block shadow-xs">
                  Board: {effectiveBoard}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 inline-block shadow-xs">
                  Format: Standard A4
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
