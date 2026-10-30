import React from 'react';
import { 
  CheckCircle2, 
  Printer, 
  Download,
  FileCheck 
} from 'lucide-react';
import { downloadPaperAsWord } from '../utils/exportUtils';

export default function AnswerKeyView({
  paper,
  headerConfig,
  onPrintAnswerKey,
  onDownloadAnswerKeyPdf,
}) {
  return (
    <div className="space-y-6">
      
      {/* Top Banner (Hidden in print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-white">
              Official Marking Scheme & Model Solutions (Teacher's Guide)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete answer keys, step-by-step marking rubrics, and detailed diagram identification solutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrintAnswerKey}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30"
          >
            <Printer className="w-4 h-4" />
            <span>Print Solutions</span>
          </button>

          <button
            type="button"
            onClick={() => downloadPaperAsWord(paper, headerConfig)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30"
          >
            <FileCheck className="w-4 h-4" />
            <span>Export Word</span>
          </button>

          <button
            type="button"
            onClick={onDownloadAnswerKeyPdf}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE ANSWER KEY SHEET */}
      <div className="flex justify-center">
        <div 
          id="printable-answer-key"
          className="printable-paper bg-white text-slate-900 shadow-2xl rounded-sm w-full max-w-[850px] min-h-[1050px] p-8 sm:p-12 font-serif border border-slate-300"
        >
          {/* HEADER */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-sans font-bold uppercase tracking-widest rounded mb-2">
              CONFIDENTIAL • TEACHER'S MARKING SCHEME
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-950 font-serif">
              {headerConfig.schoolName}
            </h1>
            <p className="text-xs font-sans font-bold text-slate-800 uppercase mt-1">
              {headerConfig.examTitle} • {headerConfig.subject} ({headerConfig.grade})
            </p>
            <p className="text-xs font-sans text-slate-600 italic">
              Evaluator's Guide & Step-by-Step Marking Rubrics
            </p>
          </div>

          {/* SECTIONS SOLUTIONS */}
          <div className="space-y-6">
            {paper.sections.map((section, secIdx) => (
              <div key={section.id || secIdx} className="space-y-4 break-inside-avoid">
                
                <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded font-sans font-bold text-xs uppercase tracking-wide text-slate-900">
                  {section.title} - MARKING SCHEME
                </div>

                <div className="space-y-4">
                  {section.questions.map((q, qIndex) => {
                    const prevCount = paper.sections
                      .slice(0, secIdx)
                      .reduce((acc, s) => acc + s.questions.length, 0);
                    const qNum = prevCount + qIndex + 1;

                    return (
                      <div 
                        key={q.id || qNum} 
                        className="border-b border-slate-200 pb-3 space-y-1.5 text-xs font-sans leading-relaxed break-inside-avoid"
                      >
                        <div className="flex items-start justify-between font-bold text-slate-900">
                          <div>
                            <span className="text-indigo-900 mr-1.5">Q{q.number || qNum}.</span>
                            <span>{q.text || q.question}</span>
                          </div>
                          <span className="shrink-0 ml-2 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-[11px]">
                            [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                          </span>
                        </div>

                        {/* MCQ Answer */}
                        {q.type === 'mcq' && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded p-2 text-emerald-950">
                            <span className="font-bold">Correct Option: </span>
                            <span>{q.answer || q.correctAnswer}</span>
                            {q.explanation && (
                              <p className="text-[11px] text-slate-700 italic mt-1 font-serif">
                                <span className="font-bold font-sans not-italic">Rationale: </span>
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Fill in the Blanks Answer */}
                        {q.type === 'fill_blanks' && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded p-2 text-emerald-950">
                            <span className="font-bold">Expected Blank: </span>
                            <span className="underline font-semibold">{q.blankAnswer || q.answer}</span>
                            {q.explanation && (
                              <p className="text-[11px] text-slate-700 italic mt-1 font-serif">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        )}

                        {/* One Word Answer */}
                        {q.type === 'one_word' && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded p-2 text-emerald-950">
                            <span className="font-bold">Answer: </span>
                            <span className="font-semibold">{q.answer || q.correctAnswer}</span>
                          </div>
                        )}

                        {/* Match Following Solution Key */}
                        {q.type === 'match_following' && (
                          <div className="bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 space-y-1">
                            <span className="font-bold block">Correct Matching Pairs:</span>
                            <div className="font-mono text-[11px] text-indigo-900 font-bold bg-white p-2 rounded border border-slate-200">
                              {q.correctMatching?.join('   |   ') || 'Matching mapped in Column table'}
                            </div>
                            {q.explanation && (
                              <p className="text-[11px] text-slate-600 italic font-serif pt-1">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Diagram Labeling Solution Key */}
                        {(q.type === 'label_the_diagram' || q.type === 'diagram_labeling' || q.labels_answer_key || q.diagramLabels?.length > 0) && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded p-3 text-emerald-950 space-y-2">
                            <div className="flex items-center justify-between font-bold text-emerald-900">
                              <span>Diagram Identification & Labeling Solution Key:</span>
                              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                                [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                              </span>
                            </div>

                            {q.imageUrl && (
                              <div className="my-2 flex justify-center">
                                <img
                                  src={q.imageUrl}
                                  alt={`Diagram Solution for Q${q.number || qNum}`}
                                  className="max-h-44 object-contain rounded border border-emerald-300 p-1 bg-white shadow-xs"
                                />
                              </div>
                            )}

                            {/* Render labels_answer_key or diagramLabels */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(q.labels_answer_key || q.diagramLabels || []).map((lbl, idx) => (
                                <div key={idx} className="bg-white p-2 rounded border border-emerald-200 flex items-center justify-between shadow-xs">
                                  <span className="font-bold text-indigo-950">
                                    Part ({lbl.pointer || lbl.label || idx + 1}):
                                  </span>
                                  <span className="font-bold text-emerald-800">
                                    {lbl.label || lbl.name || lbl.correctName}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {q.markingRubric && (
                              <p className="text-[11px] text-slate-700 italic pt-1 border-t border-emerald-200">
                                <span className="font-bold font-sans not-italic text-emerald-900">Marking Rubric: </span>
                                {q.markingRubric}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Short / Long Answer / General Model Answer & Rubric */}
                        {(q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'diagram_based' || (!q.type && (q.answer || q.modelAnswer))) && (
                          <div className="space-y-1.5 pt-1">
                            {(q.answer || q.modelAnswer) && (
                              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-serif leading-relaxed">
                                <span className="font-bold font-sans text-xs block text-slate-900 mb-0.5">
                                  Model Answer:
                                </span>
                                <div className="whitespace-pre-line text-[12px]">{q.answer || q.modelAnswer}</div>
                              </div>
                            )}

                            {q.markingRubric && (
                              <div className="p-2 bg-amber-50/70 border border-amber-300 rounded text-amber-950 text-[11px]">
                                <span className="font-bold block mb-0.5 text-amber-900">
                                  Marking Rubric:
                                </span>
                                <div>{q.markingRubric}</div>
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

          <div className="pt-8 pb-4 text-center border-t border-slate-400 text-xs font-sans text-slate-600 font-semibold uppercase tracking-widest">
            *** END OF MARKING SCHEME ***
          </div>

        </div>
      </div>

    </div>
  );
}
