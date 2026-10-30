import React from 'react';
import { Tag } from 'lucide-react';

/**
 * DiagramWithPointers Component
 * Renders cropped scientific diagrams with numbered pointers (1, 2, 3...) for "label the diagram" questions.
 */
export default function DiagramWithPointers({
  imageUrl,
  caption,
  labelsAnswerKey = [],
  isLabelTheDiagram = false,
  showAnswers = false,
  questionNumber = 1,
}) {
  if (!imageUrl) return null;

  // Default pointer pins if none provided
  const pointers = labelsAnswerKey && labelsAnswerKey.length > 0
    ? labelsAnswerKey
    : [
        { pointer: 1, label: 'Part 1' },
        { pointer: 2, label: 'Part 2' },
        { pointer: 3, label: 'Part 3' },
        { pointer: 4, label: 'Part 4' },
      ];

  // Standard pointer pin locations around the diagram
  const PIN_POSITIONS = [
    { top: '25%', left: '18%' },
    { top: '25%', right: '18%' },
    { bottom: '28%', left: '22%' },
    { bottom: '28%', right: '22%' },
    { top: '50%', left: '12%' },
    { top: '50%', right: '12%' },
  ];

  return (
    <div className="my-3 flex flex-col items-center justify-center break-inside-avoid">
      
      {/* Diagram container with relative positioning for pointers */}
      <div className="relative inline-block border border-slate-300 rounded-lg p-2 bg-white shadow-xs max-w-full">
        <img
          src={imageUrl}
          alt={caption || `Diagram for Question ${questionNumber}`}
          className="max-h-60 max-w-full object-contain rounded block mx-auto"
        />

        {/* Numbered Pointers Overlay for "Label the Diagram" */}
        {isLabelTheDiagram && (
          <div className="pointer-overlay absolute inset-0 pointer-events-none">
            {pointers.slice(0, 6).map((item, idx) => {
              const pos = PIN_POSITIONS[idx] || { top: `${30 + idx * 15}%`, left: '20%' };
              const pointerNum = item.pointer || idx + 1;

              return (
                <div
                  key={idx}
                  className="absolute flex items-center gap-1 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    top: pos.top,
                    bottom: pos.bottom,
                    left: pos.left,
                    right: pos.right,
                  }}
                >
                  {/* High-visibility circular numbered pointer badge */}
                  <span className="w-6 h-6 rounded-full bg-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-white border border-indigo-900 select-none">
                    {pointerNum}
                  </span>
                  
                  {/* If teacher solutions toggled ON, reveal label on diagram */}
                  {showAnswers && item.label && (
                    <span className="bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow ring-1 ring-white whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <span className="text-[11px] italic text-slate-600 font-sans mt-1 text-center max-w-md">
          Figure: {caption}
        </span>
      )}

      {/* Student Fill-in Blanks for "Label the Diagram" */}
      {isLabelTheDiagram && (
        <div className="w-full max-w-lg mt-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans">
          <p className="font-semibold text-slate-700 mb-2">
            Identify the parts indicated by numbers (1) to ({pointers.length}):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {pointers.map((item, idx) => {
              const num = item.pointer || idx + 1;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 min-w-[28px]">
                    ({num}):
                  </span>
                  <div className="flex-1 border-b-2 border-dotted border-slate-500 min-h-[22px] flex items-center">
                    {showAnswers && item.label && (
                      <span className="text-emerald-700 font-bold text-xs pl-1">
                        {item.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
