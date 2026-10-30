import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Printer, 
  Download, 
  Eye, 
  EyeOff, 
  Plus, 
  Check, 
  X, 
  BookOpen, 
  GraduationCap, 
  HelpCircle,
  School,
  Layers,
  FileCheck
} from 'lucide-react';
import { generateTopicPaper } from '../utils/realtimePaperGenerator';
import { triggerBrowserPrint, downloadElementAsPdf } from '../utils/exportUtils';

export default function TopicGeneratorStudio({
  headerConfig = {},
  setHeaderConfig,
  setPaper,
  showToast,
}) {
  const [subject, setSubject] = useState('General Science');
  const [grade, setGrade] = useState('Class 8');
  const [topic, setTopic] = useState('');

  // Question Types checklist
  const [questionTypes, setQuestionTypes] = useState({
    fillBlanks: true,
    oneSentence: true,
    brief: true,
    diagram: true,
    mcq: true,
    match: false,
  });

  // Teacher's Custom Question Types (e.g., "Give Scientific Reasons", "True or False")
  const [customTypes, setCustomTypes] = useState([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeMarks, setNewTypeMarks] = useState(2);

  // Teacher Answer Key / Solutions toggle
  const [showSolutions, setShowSolutions] = useState(false);

  // Quick Subject chips
  const POPULAR_SUBJECTS = [
    'General Science',
    'Physics',
    'Chemistry',
    'Biology',
    'Mathematics',
    'Social Science',
    'English',
  ];

  // Quick Topic suggestions
  const QUICK_TOPICS = [
    { title: 'Photosynthesis & Plant Life', subject: 'Biology', grade: 'Class 9' },
    { title: 'Light - Reflection and Refraction', subject: 'Physics', grade: 'Class 10' },
    { title: 'Living World and Classification of Microbes', subject: 'General Science', grade: 'Class 8' },
    { title: 'Electric Current and Circuits', subject: 'Physics', grade: 'Class 10' },
    { title: 'Acids, Bases and Salts', subject: 'Chemistry', grade: 'Class 10' },
  ];

  const toggleQuestionType = (key) => {
    setQuestionTypes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddCustomType = (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    const newType = {
      id: `custom-type-${Date.now()}`,
      name: newTypeName.trim(),
      marks: Number(newTypeMarks) || 2,
      instruction: `Answer the questions based on ${newTypeName.trim()}:`,
    };
    setCustomTypes((prev) => [...prev, newType]);
    setNewTypeName('');
    if (showToast) {
      showToast(`✓ Added question type "${newType.name}" (${newType.marks}M)!`);
    }
  };

  const handleRemoveCustomType = (id) => {
    setCustomTypes((prev) => prev.filter((ct) => ct.id !== id));
  };

  const handleSelectQuickTopic = (item) => {
    setTopic(item.title);
    setSubject(item.subject);
    setGrade(item.grade);
    if (showToast) {
      showToast(`✓ Loaded topic: "${item.title}"`);
    }
  };

  // Real-Time Generated Paper from Given Topic & Question Types
  const generatedPaper = useMemo(() => {
    return generateTopicPaper({
      subject,
      grade,
      topic,
      questionTypes,
      customTypes,
      headerConfig,
    });
  }, [subject, grade, topic, questionTypes, customTypes, headerConfig]);

  // Sync with global paper state
  useEffect(() => {
    if (setPaper && generatedPaper && generatedPaper.sections) {
      setPaper(generatedPaper);
    }
  }, [generatedPaper, setPaper]);

  const totalCalculatedMarks = generatedPaper.totalCalculatedMarks || 0;
  const totalQuestions = generatedPaper.totalQuestionCount || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start h-[calc(100vh-130px)] min-h-[580px]">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* LEFT COLUMN: TOPIC INPUT & QUESTION TYPES CONFIGURATION       */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5 bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-3 h-full max-h-full overflow-y-auto">
        
        {/* Title */}
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Direct Topic & Question Configuration
              </h3>
              <p className="text-[11px] text-slate-400">
                Specify topic and select which question types you want AI to generate
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Real-Time Engine
          </span>
        </div>

        {/* 1. Subject & Class */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Science, Physics, Maths"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Grade / Class
            </label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. Class 8, Class 10"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Quick Subject Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick:</span>
          {POPULAR_SUBJECTS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubject(sub)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition border ${
                subject.toLowerCase() === sub.toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* 2. Chapter / Topic Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Chapter / Specific Topic Name:</span>
            <span className="text-[10px] text-indigo-300">Teacher can type any topic</span>
          </label>
          <textarea
            rows={2}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Light Reflection, Chemical Reactions, Cell Structure..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium leading-relaxed"
          />
        </div>

        {/* Quick Topic Ideas */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Suggested Curriculum Topics:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TOPICS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuickTopic(item)}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-medium transition border text-left flex items-center gap-1 ${
                  topic === item.title
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-sm'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>💡 {item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Question Types Checkboxes */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Question Types to Include
            </span>
            <span className="text-[10px] text-indigo-300 font-semibold">
              Tick what you want
            </span>
          </div>

          <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            
            {/* Fill in the blanks */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 border border-slate-800 cursor-pointer select-none transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={questionTypes.fillBlanks}
                  onChange={() => toggleQuestionType('fillBlanks')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">
                  - Fill in the blanks
                </span>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                1 Mark each
              </span>
            </label>

            {/* Answer in one sentence */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 border border-slate-800 cursor-pointer select-none transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={questionTypes.oneSentence}
                  onChange={() => toggleQuestionType('oneSentence')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">
                  - Answer in one sentence
                </span>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                1 Mark each
              </span>
            </label>

            {/* Answer in brief */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 border border-slate-800 cursor-pointer select-none transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={questionTypes.brief}
                  onChange={() => toggleQuestionType('brief')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">
                  - Answer in brief / Short answer
                </span>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                3 Marks each
              </span>
            </label>

            {/* Diagram based question */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 border border-slate-800 cursor-pointer select-none transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={questionTypes.diagram}
                  onChange={() => toggleQuestionType('diagram')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-amber-300">
                  - Diagram based question
                </span>
              </div>
              <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded font-semibold">
                4 Marks
              </span>
            </label>

            {/* Multiple choice (MCQ) */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 border border-slate-800 cursor-pointer select-none transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={questionTypes.mcq}
                  onChange={() => toggleQuestionType('mcq')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">
                  - Multiple choice questions (MCQ)
                </span>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                1 Mark each
              </span>
            </label>

            {/* Match the following */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 border border-slate-800 cursor-pointer select-none transition">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={questionTypes.match}
                  onChange={() => toggleQuestionType('match')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">
                  - Match the following (Columns A & B)
                </span>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                4 Marks
              </span>
            </label>

            {/* Display Any Added Custom Types */}
            {customTypes.map((ct) => (
              <div
                key={ct.id}
                className="flex items-center justify-between p-2 rounded-lg bg-indigo-950/50 border border-indigo-500/40"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-xs">✓</span>
                  <span className="text-xs font-bold text-white">
                    - {ct.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-indigo-300 bg-indigo-900 px-1.5 py-0.5 rounded font-semibold">
                    {ct.marks}M each
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomType(ct.id)}
                    className="text-rose-400 hover:text-rose-200 p-0.5"
                    title="Remove custom type"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* 4. Add Other Question Type (Teacher's Custom Question Type) */}
        <form onSubmit={handleAddCustomType} className="space-y-1.5 pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300">
            + Add other question type teacher wants:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Give scientific reasons, True/False, Numerical"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={newTypeMarks}
              onChange={(e) => setNewTypeMarks(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none"
            >
              <option value={1}>1M</option>
              <option value={2}>2M</option>
              <option value={3}>3M</option>
              <option value={4}>4M</option>
              <option value={5}>5M</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow shrink-0"
            >
              + Add
            </button>
          </div>
        </form>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* RIGHT COLUMN: REAL-TIME QUESTION PAPER ("Paper generation")   */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col h-full max-h-full">
        
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Paper generation
              </h4>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              ● Live Real-Time Generated • {totalQuestions} Questions • {totalCalculatedMarks} Marks
            </span>
          </div>

          {/* Action buttons: Show Answers, Print, PDF */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSolutions(!showSolutions)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                showSolutions
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Toggle between Student Paper and Teacher Solution Scheme"
            >
              {showSolutions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showSolutions ? 'Answers ON' : 'Show Answers'}</span>
            </button>

            <button
              type="button"
              onClick={() => triggerBrowserPrint()}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              title="Print Question Paper"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => downloadElementAsPdf('direct-topic-question-paper', `${subject}_${topic}_Paper.pdf`)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-violet-600/30"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Live Question Paper Sheet (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 pt-3">
          <div
            id="direct-topic-question-paper"
            className="bg-white text-slate-900 rounded-lg p-6 sm:p-8 shadow-lg border border-slate-300 font-serif min-h-full space-y-5"
          >
            {/* Paper Header */}
            <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
              <h1 className="text-base sm:text-xl font-black uppercase tracking-wide text-slate-900">
                {headerConfig.schoolName || 'DELHI PUBLIC SCHOOL'}
              </h1>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                EXAMINATION: {topic.toUpperCase()}
              </h2>
              
              <div className="flex flex-wrap items-center justify-between text-xs font-sans font-semibold pt-1 text-slate-700">
                <span><strong>Subject:</strong> {subject}</span>
                <span><strong>Class:</strong> {grade}</span>
                <span><strong>Time:</strong> {generatedPaper.header.duration}</span>
                <span><strong>Max. Marks:</strong> {totalCalculatedMarks}</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] font-sans text-slate-700">
              <span className="font-bold block mb-0.5">General Instructions:</span>
              <ol className="list-decimal pl-4 space-y-0.5 text-[10.5px]">
                {generatedPaper.header.instructions?.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ol>
            </div>

            {/* Generated Sections */}
            <div className="space-y-6">
              {generatedPaper.sections.map((sec) => (
                <div key={sec.id} className="space-y-2.5">
                  
                  {/* Section Title */}
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                    <div className="font-sans font-bold text-xs uppercase tracking-wide text-slate-900">
                      SECTION {sec.letter}: {sec.title}
                    </div>
                    <span className="font-sans font-bold text-xs text-slate-700">
                      [{sec.totalSectionMarks} Marks]
                    </span>
                  </div>

                  {/* Section Instruction */}
                  <p className="text-xs italic text-slate-600 font-sans">
                    {sec.instruction}
                  </p>

                  {/* Questions List */}
                  <div className="space-y-3 pl-1">
                    {sec.questions.map((q) => (
                      <div key={q.id} className="space-y-1 text-xs text-slate-900">
                        
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-1.5 flex-1">
                            <span className="font-bold shrink-0 font-sans">
                              Q{q.number}.
                            </span>
                            <div className="flex-1 leading-relaxed">
                              <span>{q.text}</span>

                              {/* MCQ Options */}
                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-1.5 font-sans">
                                  {q.options.map((opt, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className={`px-2 py-1 rounded border text-[11px] ${
                                        showSolutions && opt === q.answer
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

                              {/* Match Columns */}
                              {q.columnA && q.columnB && (
                                <div className="mt-2 grid grid-cols-2 gap-4 font-sans bg-slate-50 p-2.5 rounded border border-slate-200">
                                  <div>
                                    <span className="font-bold text-[11px] block pb-1 border-b border-slate-300 mb-1">
                                      Column A
                                    </span>
                                    {q.columnA.map((ca, idx) => (
                                      <div key={idx} className="text-[11px] py-0.5">
                                        {ca.text}
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <span className="font-bold text-[11px] block pb-1 border-b border-slate-300 mb-1">
                                      Column B
                                    </span>
                                    {q.columnB.map((cb, idx) => (
                                      <div key={idx} className="text-[11px] py-0.5">
                                        ({String.fromCharCode(65 + idx)}) {cb.text}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Diagram Figure */}
                              {q.imageUrl && (
                                <div className="my-2.5 flex flex-col items-center justify-center p-2 bg-slate-50 rounded border border-slate-200">
                                  <img
                                    src={q.imageUrl}
                                    alt="Examination Diagram"
                                    className="max-h-56 max-w-full object-contain rounded"
                                  />
                                </div>
                              )}

                              {/* Diagram Sub-Questions */}
                              {q.subQuestions && q.subQuestions.length > 0 && (
                                <div className="space-y-1 mt-1 pl-2 font-sans text-[11px] text-slate-800">
                                  {q.subQuestions.map((subQ, subIdx) => (
                                    <div key={subIdx}>
                                      {subQ}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="font-bold font-sans text-slate-700 shrink-0">
                            ({q.marks}M)
                          </span>
                        </div>

                        {/* Teacher Solution & Rubric (Visible when Answer Key is toggled) */}
                        {showSolutions && (
                          <div className="mt-1.5 ml-5 p-2 bg-emerald-50 border-l-4 border-emerald-600 rounded text-[11px] font-sans text-emerald-950 space-y-0.5">
                            <div>
                              <strong className="text-emerald-900">Model Answer: </strong>
                              <span className="font-medium whitespace-pre-wrap">{q.answer}</span>
                            </div>
                            {q.markingRubric && (
                              <div className="text-[10px] text-emerald-800 italic">
                                <strong>Rubric: </strong>{q.markingRubric}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>

            {/* Paper Footer */}
            <div className="pt-6 border-t border-slate-400 text-center text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
              *** END OF QUESTION PAPER ***
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
