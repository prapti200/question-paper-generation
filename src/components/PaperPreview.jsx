import { 
  Printer, 
  Download, 
  Settings, 
  Edit3, 
  Share2, 
  CheckCircle2, 
  Eye, 
  Award, 
  FileCheck 
} from 'lucide-react';
import { downloadPaperAsWord } from '../utils/exportUtils';
import DiagramWithPointers from './DiagramWithPointers';

export default function PaperPreview({
  paper,
  headerConfig,
  onOpenHeaderSettings,
  onOpenEditor,
  onPrint,
  onDownloadPdf,
}) {
  const totalCalculatedMarks = paper.sections.reduce(
    (sum, sec) => sum + sec.questions.reduce((qSum, q) => qSum + (Number(q.marks) || 0), 0),
    0
  );

  const displayMarks = headerConfig.autoCalculateMarks
    ? totalCalculatedMarks
    : headerConfig.maxMarks;

  return (
    <div className="space-y-6">
      
      {/* Action Controls Bar (Hidden during print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Eye className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-white">
              Official Examination Paper View (A4 Layout)
            </h2>
            <button
              type="button"
              onClick={onOpenHeaderSettings}
              className="text-xs bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium transition"
            >
              🏫 {headerConfig.schoolName || 'Custom School'} ✏️
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Formatted to official CBSE / Board examination guidelines with watermark, school emblem, and aligned marks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenHeaderSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Customize School & Header</span>
          </button>

          <button
            type="button"
            onClick={onOpenEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Questions</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
          >
            <Printer className="w-4 h-4" />
            <span>Print Paper</span>
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
            onClick={onDownloadPdf}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-violet-600/30"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* A4 PAPER CONTAINER */}
      <div className="printable-paper-wrapper flex justify-center">
        <div 
          id="printable-question-paper"
          className="printable-paper bg-white text-slate-900 shadow-2xl rounded-sm w-full max-w-[850px] min-h-[1120px] p-8 sm:p-12 relative overflow-hidden font-serif border border-slate-300"
          style={{ boxSizing: 'border-box' }}
        >
          
          {/* WATERMARK LAYER */}
          {headerConfig.watermark?.enabled && (
            <div 
              className="watermark-overlay absolute inset-0 pointer-events-none select-none flex items-center justify-center z-0 overflow-hidden"
            >
              <div
                className="font-black text-center tracking-widest uppercase text-slate-900"
                style={{
                  opacity: headerConfig.watermark.opacity || 0.08,
                  transform: `rotate(${headerConfig.watermark.angle || -30}deg)`,
                  fontSize: `${headerConfig.watermark.fontSize || 48}px`,
                  lineHeight: '1.2',
                  maxWidth: '90%',
                  wordBreak: 'break-word',
                  letterSpacing: '0.15em'
                }}
              >
                {headerConfig.watermark.text || headerConfig.schoolName || 'CONFIDENTIAL'}
              </div>
            </div>
          )}

          {/* MAIN DOCUMENT CONTENT (Over Watermark) */}
          <div className="relative z-10 space-y-4 text-sm leading-normal">
            
            {/* SCHOOL / INSTITUTION HEADER */}
            <div className="text-center space-y-1 pb-2">
              
              {/* Logo & School Name */}
              <div className="flex items-center justify-between gap-4">
                {headerConfig.showLogo && headerConfig.logoUrl && headerConfig.logoPosition !== 'right' ? (
                  <img
                    src={headerConfig.logoUrl}
                    alt="School Logo"
                    className="w-16 h-16 object-contain rounded-md border border-slate-300 p-0.5"
                  />
                ) : (
                  <div className="w-16"></div>
                )}

                <div 
                  onClick={onOpenHeaderSettings}
                  title="Click to customize School Name or Exam Title"
                  className="flex-1 text-center cursor-pointer group hover:bg-slate-50 rounded-lg p-1 transition"
                >
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-950 font-serif leading-tight group-hover:text-indigo-900 transition flex items-center justify-center gap-2">
                    <span>{headerConfig.schoolName || 'DELHI PUBLIC SCHOOL'}</span>
                    <span className="no-print opacity-0 group-hover:opacity-100 text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 transition font-sans">
                      ✏️ Edit
                    </span>
                  </h1>
                  {headerConfig.affiliation && (
                    <p className="text-xs text-slate-700 italic font-sans font-medium mt-0.5">
                      {headerConfig.affiliation}
                    </p>
                  )}
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900 mt-1 font-sans">
                    {headerConfig.examTitle || 'ANNUAL EXAMINATION (2025-2026)'}
                  </h2>
                </div>

                {headerConfig.showLogo && headerConfig.logoUrl && headerConfig.logoPosition === 'right' ? (
                  <img
                    src={headerConfig.logoUrl}
                    alt="School Logo"
                    className="w-16 h-16 object-contain rounded-md border border-slate-300 p-0.5"
                  />
                ) : (
                  <div className="w-16"></div>
                )}
              </div>

              {/* Subject & Meta Grid */}
              <div className="pt-2 border-t border-slate-800/80 mt-2">
                <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-900 font-sans uppercase px-1 gap-2">
                  <span>
                    SUBJECT: {headerConfig.subject || 'SCIENCE'}{' '}
                    {headerConfig.subjectCode ? `(${headerConfig.subjectCode})` : ''}
                  </span>
                  <span>CLASS: {headerConfig.grade || 'CLASS X'}</span>
                  <span>MAX. MARKS: {displayMarks}</span>
                  <span>TIME ALLOWED: {headerConfig.duration || '3 HOURS'}</span>
                </div>

                {headerConfig.facultyName && (
                  <div className="text-right text-[11px] text-slate-600 font-sans italic pt-0.5">
                    {headerConfig.facultyName}
                  </div>
                )}
              </div>

            </div>

            {/* CANDIDATE DETAILS ROW (PRINTABLE) */}
            <div className="border border-slate-800 rounded p-2 text-xs font-sans text-slate-800 bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {headerConfig.studentFields?.showRollNo && (
                  <div>
                    <span className="font-bold">Roll No:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 inline-block w-24"></span>
                  </div>
                )}
                {headerConfig.studentFields?.showStudentName && (
                  <div className="sm:col-span-2">
                    <span className="font-bold">Candidate Name:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 inline-block w-44"></span>
                  </div>
                )}
                {headerConfig.studentFields?.showSection && (
                  <div>
                    <span className="font-bold">Section:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 inline-block w-16"></span>
                  </div>
                )}
                {headerConfig.studentFields?.showDate && (
                  <div>
                    <span className="font-bold">Date:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 inline-block w-24"></span>
                  </div>
                )}
                {headerConfig.studentFields?.showInvigilatorSign && (
                  <div className="sm:col-span-3 text-right">
                    <span className="font-bold">Invigilator's Sign:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 inline-block w-28"></span>
                  </div>
                )}
              </div>
            </div>

            {/* DOUBLE DIVIDER LINE */}
            <div className="border-t-2 border-b border-slate-950 py-0.5"></div>

            {/* GENERAL INSTRUCTIONS */}
            {headerConfig.instructions?.length > 0 && (
              <div className="p-3 border border-slate-400 rounded bg-slate-50/40 space-y-1">
                <span className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 block underline">
                  General Instructions:
                </span>
                <ol className="list-decimal list-inside text-xs space-y-0.5 text-slate-800 font-sans leading-relaxed">
                  {headerConfig.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* EXAMINATION SECTIONS & QUESTIONS */}
            <div className="space-y-6 pt-3">
              {paper.sections.map((section, secIdx) => {
                const sectionMarks = section.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

                return (
                  <div key={section.id || secIdx} className="space-y-3 break-inside-avoid">
                    
                    {/* Section Header */}
                    <div className="text-center border-t border-b border-slate-800 py-1.5 my-3 bg-slate-100/60">
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-950 font-sans">
                        {section.title} [{sectionMarks} MARKS]
                      </h3>
                      {section.instruction && (
                        <p className="text-[11px] text-slate-700 italic font-sans mt-0.5">
                          ({section.instruction})
                        </p>
                      )}
                    </div>

                    {/* Section Questions */}
                    <div className="space-y-4">
                      {section.questions.map((q, qIndex) => {
                        const prevCount = paper.sections
                          .slice(0, secIdx)
                          .reduce((acc, s) => acc + s.questions.length, 0);
                        const currentQNum = prevCount + qIndex + 1;

                        return (
                          <div 
                            key={q.id || currentQNum} 
                            className="question-block space-y-1.5 break-inside-avoid text-slate-900"
                          >
                            
                            {/* Question Title & Marks */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 font-serif text-[13px] sm:text-sm leading-relaxed">
                                <span className="font-bold font-sans mr-1.5">
                                  Q{q.number || currentQNum}.
                                </span>
                                <span className="whitespace-pre-line">{q.text || q.question}</span>
                              </div>
                              <div className="text-xs font-bold font-sans text-slate-900 shrink-0 pt-0.5">
                                [{q.marks}]
                              </div>
                            </div>

                            {/* Diagram with Numbered Pointers or Standard Figure */}
                            {q.imageUrl && (
                              <DiagramWithPointers
                                imageUrl={q.imageUrl}
                                caption={q.figureCaption}
                                labelsAnswerKey={q.labels_answer_key || q.diagramLabels}
                                isLabelTheDiagram={q.type === 'label_the_diagram' || q.type === 'label-the-diagram' || q.type === 'diagram_labeling' || Boolean(q.labels_answer_key)}
                                showAnswers={false}
                                questionNumber={q.number || currentQNum}
                              />
                            )}

                            {/* 1. MCQ OPTIONS FORMAT */}
                            {q.type === 'mcq' && q.options && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-6 pt-1 text-xs font-sans">
                                {q.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-start gap-1.5">
                                    <span className="font-bold">
                                      ({String.fromCharCode(97 + optIndex)})
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 2. MATCH THE FOLLOWING TWO-COLUMN TABLE */}
                            {q.type === 'match_following' && (
                              <div className="pl-6 pt-1 max-w-xl">
                                <table className="w-full text-xs font-sans border-collapse border border-slate-400">
                                  <thead>
                                    <tr className="bg-slate-100/80">
                                      <th className="border border-slate-400 p-1.5 text-left font-bold w-1/2">
                                        Column A
                                      </th>
                                      <th className="border border-slate-400 p-1.5 text-left font-bold w-1/2">
                                        Column B
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {q.columnA?.map((colA, rowIdx) => {
                                      const colB = q.columnB?.[rowIdx];
                                      return (
                                        <tr key={rowIdx}>
                                          <td className="border border-slate-400 p-1.5 align-top">
                                            {colA.text}
                                          </td>
                                          <td className="border border-slate-400 p-1.5 align-top">
                                            {colB?.text || ''}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* END OF PAPER FOOTER */}
            <div className="pt-8 pb-4 text-center border-t border-slate-400 text-xs font-sans text-slate-600 font-semibold uppercase tracking-widest">
              *** END OF QUESTION PAPER ***
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
