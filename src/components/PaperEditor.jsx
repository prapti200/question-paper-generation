import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Edit3, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Layers, 
  Check, 
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function PaperEditor({
  paper,
  setPaper,
  onOpenPreview,
}) {
  const [expandedSections, setExpandedSections] = useState(() => {
    const map = {};
    paper.sections.forEach((s) => { map[s.id] = true; });
    return map;
  });

  const toggleSection = (secId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  // Modify Section Header
  const updateSection = (secIndex, fields) => {
    const updated = [...paper.sections];
    updated[secIndex] = { ...updated[secIndex], ...fields };
    setPaper({ ...paper, sections: updated });
  };

  // Add Section
  const addSection = () => {
    const newId = `sec-${Date.now()}`;
    const newSection = {
      id: newId,
      title: `SECTION ${String.fromCharCode(65 + paper.sections.length)}: CUSTOM SECTION`,
      instruction: "Answer the following questions as directed.",
      marksEach: 1,
      questions: [
        {
          id: `q-${Date.now()}`,
          type: "mcq",
          question: "New sample question prompt...",
          marks: 1,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          explanation: "Explanation here..."
        }
      ]
    };
    setPaper({ ...paper, sections: [...paper.sections, newSection] });
    setExpandedSections((prev) => ({ ...prev, [newId]: true }));
  };

  // Remove Section
  const removeSection = (secIndex) => {
    if (paper.sections.length <= 1) {
      alert("A question paper must have at least one section.");
      return;
    }
    const updated = paper.sections.filter((_, i) => i !== secIndex);
    setPaper({ ...paper, sections: updated });
  };

  // Modify Question
  const updateQuestion = (secIndex, qIndex, fields) => {
    const updatedSections = [...paper.sections];
    const targetSection = { ...updatedSections[secIndex] };
    const updatedQuestions = [...targetSection.questions];
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], ...fields };
    targetSection.questions = updatedQuestions;
    updatedSections[secIndex] = targetSection;
    setPaper({ ...paper, sections: updatedSections });
  };

  // Move Question Up / Down
  const moveQuestion = (secIndex, qIndex, direction) => {
    const updatedSections = [...paper.sections];
    const targetSection = { ...updatedSections[secIndex] };
    const updatedQuestions = [...targetSection.questions];

    const targetPos = qIndex + direction;
    if (targetPos < 0 || targetPos >= updatedQuestions.length) return;

    const temp = updatedQuestions[qIndex];
    updatedQuestions[qIndex] = updatedQuestions[targetPos];
    updatedQuestions[targetPos] = temp;

    targetSection.questions = updatedQuestions;
    updatedSections[secIndex] = targetSection;
    setPaper({ ...paper, sections: updatedSections });
  };

  // Delete Question
  const deleteQuestion = (secIndex, qIndex) => {
    const updatedSections = [...paper.sections];
    const targetSection = { ...updatedSections[secIndex] };
    targetSection.questions = targetSection.questions.filter((_, i) => i !== qIndex);
    updatedSections[secIndex] = targetSection;
    setPaper({ ...paper, sections: updatedSections });
  };

  // Duplicate Question
  const duplicateQuestion = (secIndex, qIndex) => {
    const updatedSections = [...paper.sections];
    const targetSection = { ...updatedSections[secIndex] };
    const sourceQ = targetSection.questions[qIndex];
    const duplicated = {
      ...JSON.parse(JSON.stringify(sourceQ)),
      id: `q-${Date.now()}`,
      question: `${sourceQ.question} (Copy)`
    };
    targetSection.questions.splice(qIndex + 1, 0, duplicated);
    updatedSections[secIndex] = targetSection;
    setPaper({ ...paper, sections: updatedSections });
  };

  // Add Question to Section
  const addQuestion = (secIndex, type = 'mcq') => {
    const updatedSections = [...paper.sections];
    const targetSection = { ...updatedSections[secIndex] };
    const newId = `q-${Date.now()}`;

    let newQ = {
      id: newId,
      type,
      question: "Enter new question prompt...",
      marks: type === 'long_answer' ? 5 : type === 'short_answer' ? 3 : type === 'match_following' ? 4 : 1,
      explanation: "",
    };

    if (type === 'mcq') {
      newQ.options = ["Option A", "Option B", "Option C", "Option D"];
      newQ.correctAnswer = "Option A";
    } else if (type === 'fill_blanks') {
      newQ.question = "Enter sentence with __________ blank space.";
      newQ.blankAnswer = "answer";
    } else if (type === 'one_word') {
      newQ.question = "Name the term for...";
      newQ.correctAnswer = "Term";
    } else if (type === 'match_following') {
      newQ.question = "Match the following items:";
      newQ.columnA = [
        { id: "a1", text: "(i) Term 1" },
        { id: "a2", text: "(ii) Term 2" },
        { id: "a3", text: "(iii) Term 3" },
        { id: "a4", text: "(iv) Term 4" }
      ];
      newQ.columnB = [
        { id: "b1", text: "(P) Match 1" },
        { id: "b2", text: "(Q) Match 2" },
        { id: "b3", text: "(R) Match 3" },
        { id: "b4", text: "(S) Match 4" }
      ];
      newQ.correctMatching = ["(i) -> (P)", "(ii) -> (Q)", "(iii) -> (R)", "(iv) -> (S)"];
    } else if (type === 'diagram_labeling') {
      newQ.question = "Study the given diagram carefully and label the parts indicated by (A), (B), (C), and (D):";
      newQ.marks = 4;
      newQ.imageUrl = "";
      newQ.diagramLabels = [
        { label: "A", name: "Structure A" },
        { label: "B", name: "Structure B" },
        { label: "C", name: "Structure C" },
        { label: "D", name: "Structure D" }
      ];
      newQ.modelAnswer = "(A) Structure A\n(B) Structure B\n(C) Structure C\n(D) Structure D";
      newQ.markingRubric = "1 Mark for each correctly labeled and identified part.";
    } else if (type === 'short_answer' || type === 'long_answer') {
      newQ.modelAnswer = "Model answer details...";
      newQ.markingRubric = "Marks distribution criteria...";
    }

    targetSection.questions.push(newQ);
    updatedSections[secIndex] = targetSection;
    setPaper({ ...paper, sections: updatedSections });
  };

  // Calculate total marks across paper
  const totalPaperMarks = paper.sections.reduce(
    (sum, sec) => sum + sec.questions.reduce((qSum, q) => qSum + (Number(q.marks) || 0), 0),
    0
  );

  const totalQuestionCount = paper.sections.reduce(
    (sum, sec) => sum + sec.questions.length,
    0
  );

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            <span>Interactive Question Paper Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review, edit question text, adjust marks, reorder, or add teacher revisions inline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200">
            Total Marks: <span className="text-indigo-400 font-bold">{totalPaperMarks}</span> • Questions: <span className="text-indigo-400 font-bold">{totalQuestionCount}</span>
          </div>

          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>

          <button
            type="button"
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
          >
            <span>View Printable A4 Paper</span>
          </button>
        </div>
      </div>

      {/* SECTIONS ACCORDION LIST */}
      <div className="space-y-6">
        {paper.sections.map((section, secIndex) => {
          const isExpanded = !!expandedSections[section.id];
          const sectionMarks = section.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

          return (
            <div
              key={section.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition"
            >
              {/* Section Header */}
              <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <button
                    type="button"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={section.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateSection(secIndex, { title: e.target.value })}
                      className="text-sm font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none w-full max-w-lg"
                    />
                    <input
                      type="text"
                      value={section.instruction}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateSection(secIndex, { instruction: e.target.value })}
                      className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none w-full max-w-xl block mt-0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                    {section.questions.length} Questions • {sectionMarks} Marks
                  </span>

                  {/* Add Question dropdown to this section */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold border border-indigo-500/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                    <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-30 hidden group-hover:block animate-fade-in">
                      {[
                        { type: 'mcq', label: '+ MCQ (4 Options)' },
                        { type: 'fill_blanks', label: '+ Fill in Blanks' },
                        { type: 'one_word', label: '+ One Word Answer' },
                        { type: 'match_following', label: '+ Match Columns' },
                        { type: 'diagram_labeling', label: '+ Diagram Labeling' },
                        { type: 'short_answer', label: '+ Short Answer' },
                        { type: 'long_answer', label: '+ Long Answer' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => addQuestion(secIndex, item.type)}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSection(secIndex)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section Questions */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {section.questions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No questions in this section yet. Click "+ Add Question" above.
                    </div>
                  ) : (
                    section.questions.map((q, qIndex) => (
                      <div
                        key={q.id || qIndex}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
                      >
                        {/* Question Card Top Bar */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-indigo-400 w-6">
                              Q{qIndex + 1}.
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {q.type.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                              <span className="text-[10px] text-slate-400">Marks:</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={q.marks || 1}
                                onChange={(e) => updateQuestion(secIndex, qIndex, { marks: Number(e.target.value) })}
                                className="w-10 bg-transparent text-xs font-bold text-white text-center focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => moveQuestion(secIndex, qIndex, -1)}
                              disabled={qIndex === 0}
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move Question Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => moveQuestion(secIndex, qIndex, 1)}
                              disabled={qIndex === section.questions.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move Question Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => duplicateQuestion(secIndex, qIndex)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-300"
                              title="Duplicate Question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteQuestion(secIndex, qIndex)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Prompt Textarea */}
                        <div>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => updateQuestion(secIndex, qIndex, { question: e.target.value })}
                            placeholder="Question text..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 leading-relaxed"
                          />
                        </div>

                        {/* TYPE SPECIFIC FORM CONTROLS */}
                        
                        {/* 1. MCQ Options */}
                        {q.type === 'mcq' && q.options && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-semibold text-slate-400 block">
                              Options (Click checkmark circle to set correct answer):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, optIndex) => {
                                const isCorrect = q.correctAnswer === opt;
                                return (
                                  <div
                                    key={optIndex}
                                    className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                      isCorrect
                                        ? 'bg-emerald-950/30 border-emerald-500/40'
                                        : 'bg-slate-900 border-slate-800'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => updateQuestion(secIndex, qIndex, { correctAnswer: opt })}
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition ${
                                        isCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                      }`}
                                      title={isCorrect ? 'Correct option' : 'Set as correct option'}
                                    >
                                      {String.fromCharCode(65 + optIndex)}
                                    </button>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...q.options];
                                        newOpts[optIndex] = e.target.value;
                                        const newFields = { options: newOpts };
                                        if (isCorrect) newFields.correctAnswer = e.target.value;
                                        updateQuestion(secIndex, qIndex, newFields);
                                      }}
                                      className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
                                    />
                                    {isCorrect && (
                                      <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60">
                                        Correct
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 2. Fill in Blanks */}
                        {q.type === 'fill_blanks' && (
                          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Expected Blank Answer:
                            </label>
                            <input
                              type="text"
                              value={q.blankAnswer || ''}
                              onChange={(e) => updateQuestion(secIndex, qIndex, { blankAnswer: e.target.value })}
                              placeholder="e.g. Dioptre / Joule / CaSO4"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-medium focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        )}

                        {/* 3. One Word Answer */}
                        {q.type === 'one_word' && (
                          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Correct One-Word Answer:
                            </label>
                            <input
                              type="text"
                              value={q.correctAnswer || ''}
                              onChange={(e) => updateQuestion(secIndex, qIndex, { correctAnswer: e.target.value })}
                              placeholder="e.g. Retina / Photosynthesis"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-medium focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        )}

                        {/* 4. Match the Following */}
                        {q.type === 'match_following' && (
                          <div className="space-y-3 pt-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Column A */}
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                                <span className="text-xs font-bold text-indigo-400 block">Column A</span>
                                {q.columnA?.map((col, idx) => (
                                  <input
                                    key={col.id || idx}
                                    type="text"
                                    value={col.text}
                                    onChange={(e) => {
                                      const updatedColA = [...q.columnA];
                                      updatedColA[idx] = { ...col, text: e.target.value };
                                      updateQuestion(secIndex, qIndex, { columnA: updatedColA });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                  />
                                ))}
                              </div>

                              {/* Column B */}
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                                <span className="text-xs font-bold text-indigo-400 block">Column B</span>
                                {q.columnB?.map((col, idx) => (
                                  <input
                                    key={col.id || idx}
                                    type="text"
                                    value={col.text}
                                    onChange={(e) => {
                                      const updatedColB = [...q.columnB];
                                      updatedColB[idx] = { ...col, text: e.target.value };
                                      updateQuestion(secIndex, qIndex, { columnB: updatedColB });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Matching Key */}
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                                Matching Solution Key:
                              </label>
                              <input
                                type="text"
                                value={q.correctMatching?.join(', ') || ''}
                                onChange={(e) => {
                                  updateQuestion(secIndex, qIndex, {
                                    correctMatching: e.target.value.split(',').map((s) => s.trim()),
                                  });
                                }}
                                placeholder="(i) -> (Q), (ii) -> (P), (iii) -> (S), (iv) -> (R)"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-mono focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* 5. Diagram Labeling Question */}
                        {q.type === 'diagram_labeling' && (
                          <div className="space-y-3 pt-1">
                            {q.imageUrl && (
                              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                                <img
                                  src={q.imageUrl}
                                  alt="Diagram Preview"
                                  className="h-20 w-auto object-contain rounded border border-slate-700 bg-white shadow-xs"
                                />
                                <div className="flex-1 text-xs text-slate-300">
                                  <span className="font-bold block text-white">Embedded Diagram Image</span>
                                  <span className="text-[11px] text-slate-400">
                                    Diagram pins ({q.diagramLabels?.map((l) => l.label).join(', ') || 'A, B, C, D'}) are burned into this diagram.
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Diagram Labels and answers */}
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-400">
                                  Diagram Labels & Marking Scheme:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextLetter = String.fromCharCode(65 + (q.diagramLabels?.length || 0));
                                    const updated = [
                                      ...(q.diagramLabels || []),
                                      { label: nextLetter, name: `Structure ${nextLetter}` },
                                    ];
                                    updateQuestion(secIndex, qIndex, {
                                      diagramLabels: updated,
                                      marks: updated.length,
                                      modelAnswer: updated.map((l) => `(${l.label}) ${l.name}`).join('\n'),
                                    });
                                  }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition"
                                >
                                  + Add Label
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.diagramLabels?.map((lbl, lIdx) => (
                                  <div
                                    key={lIdx}
                                    className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800"
                                  >
                                    <span className="font-bold text-xs text-indigo-300 min-w-[24px]">
                                      ({lbl.label}):
                                    </span>
                                    <input
                                      type="text"
                                      value={lbl.name}
                                      onChange={(e) => {
                                        const updated = [...q.diagramLabels];
                                        updated[lIdx] = { ...lbl, name: e.target.value };
                                        updateQuestion(secIndex, qIndex, {
                                          diagramLabels: updated,
                                          modelAnswer: updated.map((l) => `(${l.label}) ${l.name}`).join('\n'),
                                        });
                                      }}
                                      className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                                      placeholder="Correct label name..."
                                    />
                                    {q.diagramLabels.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = q.diagramLabels.filter((_, i) => i !== lIdx);
                                          updateQuestion(secIndex, qIndex, {
                                            diagramLabels: updated,
                                            marks: updated.length,
                                            modelAnswer: updated.map((l) => `(${l.label}) ${l.name}`).join('\n'),
                                          });
                                        }}
                                        className="text-slate-500 hover:text-rose-400 text-xs px-1"
                                        title="Remove label"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 6. Short / Long Answer Model Answer & Rubric */}
                        {(q.type === 'short_answer' || q.type === 'long_answer') && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                              <label className="text-[11px] font-semibold text-emerald-400">
                                Model Answer / Solution:
                              </label>
                              <textarea
                                rows={3}
                                value={q.modelAnswer || ''}
                                onChange={(e) => updateQuestion(secIndex, qIndex, { modelAnswer: e.target.value })}
                                placeholder="Write step-by-step model answer..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                              <label className="text-[11px] font-semibold text-indigo-400">
                                Step-by-Step Marking Rubric:
                              </label>
                              <textarea
                                rows={3}
                                value={q.markingRubric || ''}
                                onChange={(e) => updateQuestion(secIndex, qIndex, { markingRubric: e.target.value })}
                                placeholder="e.g. 1 Mark for formula, 1 Mark for calculation, 1 Mark for correct units"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Explanation / Hint for all questions */}
                        <div className="pt-1">
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => updateQuestion(secIndex, qIndex, { explanation: e.target.value })}
                            placeholder="Teacher's rationale or reference explanation (optional)..."
                            className="w-full bg-slate-900/60 border border-slate-800/60 rounded-lg px-2.5 py-1 text-[11px] text-slate-400 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
