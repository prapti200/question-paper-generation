import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Sparkles, 
  Plus, 
  Trash2, 
  Crop, 
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESET_DIAGRAM_TOPICS = [
  {
    name: 'General Science / Biology (Default)',
    labels: [
      { letter: 'A', name: 'Cell Membrane / Outer Layer', x: 25, y: 28 },
      { letter: 'B', name: 'Nucleus / Central Control', x: 72, y: 32 },
      { letter: 'C', name: 'Mitochondria / Organelle', x: 30, y: 68 },
      { letter: 'D', name: 'Cytoplasm / Matrix', x: 68, y: 72 },
    ]
  },
  {
    name: 'Human Eye & Optics (Physics/Bio)',
    labels: [
      { letter: 'A', name: 'Cornea', x: 20, y: 45 },
      { letter: 'B', name: 'Iris & Pupil', x: 35, y: 35 },
      { letter: 'C', name: 'Crystalline Eye Lens', x: 45, y: 50 },
      { letter: 'D', name: 'Retina & Optic Nerve', x: 80, y: 50 },
    ]
  },
  {
    name: 'Digestive & Internal Organs',
    labels: [
      { letter: 'A', name: 'Esophagus / Food Pipe', x: 50, y: 20 },
      { letter: 'B', name: 'Stomach', x: 42, y: 45 },
      { letter: 'C', name: 'Liver / Gall Bladder', x: 62, y: 42 },
      { letter: 'D', name: 'Small / Large Intestine', x: 52, y: 75 },
    ]
  },
  {
    name: 'Bacterial Cell Structure (Biology)',
    labels: [
      { letter: 'A', name: 'Cell Wall / Capsule', x: 22, y: 30 },
      { letter: 'B', name: 'Flagellum / Locomotory organ', x: 82, y: 25 },
      { letter: 'C', name: 'Bacterial DNA / Nucleoid', x: 50, y: 50 },
      { letter: 'D', name: 'Ribosomes / Storage granule', x: 35, y: 70 },
    ]
  },
  {
    name: 'Light Reflection & Mirror Apparatus',
    labels: [
      { letter: 'A', name: 'Incident Light Ray', x: 25, y: 30 },
      { letter: 'B', name: 'Normal at Point of Incidence', x: 50, y: 25 },
      { letter: 'C', name: 'Reflected Light Ray', x: 75, y: 30 },
      { letter: 'D', name: 'Reflecting Surface / Mirror', x: 50, y: 75 },
    ]
  }
];

export default function DiagramLabelingModal({
  isOpen,
  onClose,
  page,
  onInsertQuestion,
  sections = [],
}) {
  const containerRef = useRef(null);

  // Crop Region (percentages 0-100)
  const [cropRegion, setCropRegion] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [cropPreset, setCropPreset] = useState('full'); // 'full' | 'top' | 'center' | 'bottom'

  // Labels state: array of { letter, name, x: percentage (0-100), y: percentage (0-100) }
  const [labels, setLabels] = useState([
    { letter: 'A', name: 'Structure / Part A', x: 25, y: 30 },
    { letter: 'B', name: 'Structure / Part B', x: 72, y: 32 },
    { letter: 'C', name: 'Structure / Part C', x: 28, y: 68 },
    { letter: 'D', name: 'Structure / Part D', x: 70, y: 72 },
  ]);

  const [activeLabelIndex, setActiveLabelIndex] = useState(0);

  // Question metadata
  const [questionText, setQuestionText] = useState(
    'Study the given diagram carefully and identify / label the parts indicated by (A), (B), (C), and (D):'
  );
  const [marks, setMarks] = useState(4);
  const [targetSectionId, setTargetSectionId] = useState(sections[2]?.id || 'sec-d');

  // Sync when page changes
  useEffect(() => {
    if (page) {
      setQuestionText(
        `Study the given diagram carefully and label the parts indicated by ${labels.map(l => `(${l.letter})`).join(', ')}:`
      );
    }
  }, [page, labels.length]);

  if (!isOpen || !page) return null;

  // Handle Preset Selection
  const applyPreset = (preset) => {
    setLabels(preset.labels.map(l => ({ ...l })));
    setMarks(preset.labels.length);
    setQuestionText(
      `Study the given diagram carefully and label the parts indicated by ${preset.labels.map(l => `(${l.letter})`).join(', ')}:`
    );
  };

  // Handle Crop Preset change
  const handleCropPresetChange = (preset) => {
    setCropPreset(preset);
    if (preset === 'full') {
      setCropRegion({ x: 0, y: 0, width: 100, height: 100 });
    } else if (preset === 'top') {
      setCropRegion({ x: 5, y: 5, width: 90, height: 48 });
    } else if (preset === 'center') {
      setCropRegion({ x: 8, y: 22, width: 84, height: 55 });
    } else if (preset === 'bottom') {
      setCropRegion({ x: 5, y: 48, width: 90, height: 48 });
    }
  };

  // Click on diagram to reposition active pin
  const handleDiagramClick = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(5, Math.min(95, Math.round(clickX)));
    const clampedY = Math.max(5, Math.min(95, Math.round(clickY)));

    setLabels((prev) => {
      const updated = [...prev];
      if (updated[activeLabelIndex]) {
        updated[activeLabelIndex] = {
          ...updated[activeLabelIndex],
          x: clampedX,
          y: clampedY,
        };
      }
      return updated;
    });
  };

  // Add new label
  const handleAddLabel = () => {
    const nextCharCode = 65 + labels.length;
    if (nextCharCode > 74) return; // Limit to J (10 labels)
    const letter = String.fromCharCode(nextCharCode);
    const newLabel = {
      letter,
      name: `Structure / Part ${letter}`,
      x: 50,
      y: 50,
    };
    const updated = [...labels, newLabel];
    setLabels(updated);
    setActiveLabelIndex(updated.length - 1);
    setMarks(updated.length);
    setQuestionText(
      `Study the given diagram carefully and label the parts indicated by ${updated.map(l => `(${l.letter})`).join(', ')}:`
    );
  };

  // Remove label
  const handleRemoveLabel = (index) => {
    if (labels.length <= 1) return;
    const filtered = labels.filter((_, i) => i !== index);
    const reindexed = filtered.map((l, i) => ({
      ...l,
      letter: String.fromCharCode(65 + i),
    }));
    setLabels(reindexed);
    setActiveLabelIndex(Math.max(0, index - 1));
    setMarks(reindexed.length);
  };

  // Update label name
  const updateLabelName = (index, newName) => {
    setLabels((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], name: newName };
      }
      return updated;
    });
  };

  // Generate Composite Image with Burned-In Badges
  const generateCompositeDiagram = () => {
    return new Promise((resolve, reject) => {
      if (!page.dataUrl) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Source crop coordinates
          const sx = (cropRegion.x / 100) * img.naturalWidth;
          const sy = (cropRegion.y / 100) * img.naturalHeight;
          const sWidth = (cropRegion.width / 100) * img.naturalWidth;
          const sHeight = (cropRegion.height / 100) * img.naturalHeight;

          canvas.width = Math.max(300, Math.round(sWidth));
          canvas.height = Math.max(200, Math.round(sHeight));

          // Draw cropped diagram background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

          // Draw Label Pins (A, B, C, D)
          labels.forEach((lbl) => {
            const px = (lbl.x / 100) * canvas.width;
            const py = (lbl.y / 100) * canvas.height;

            const radius = Math.max(14, Math.round(canvas.width * 0.024));

            // Outer drop-shadow circle
            ctx.beginPath();
            ctx.arc(px, py, radius + 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fill();

            // Inner Badge circle
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#4f46e5';
            ctx.fill();

            // Border
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Letter text
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(radius * 1.15)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(lbl.letter, px, py);

            // Pointer pulse ring
            ctx.beginPath();
            ctx.arc(px, py, radius + 6, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(79, 70, 229, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });

          const resultDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(resultDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => reject(err);
      img.src = page.dataUrl;
    });
  };

  // Submit and Insert into Question Paper
  const handleInsert = async () => {
    try {
      const finalImageUrl = await generateCompositeDiagram();

      const newQuestion = {
        id: `q-diag-${Date.now()}`,
        type: 'diagram_labeling',
        question: questionText,
        marks: Number(marks) || labels.length,
        imageUrl: finalImageUrl || page.dataUrl || '',
        diagramLabels: labels.map((l) => ({
          label: l.letter,
          name: l.name,
        })),
        modelAnswer: labels
          .map((l) => `Part (${l.letter}): ${l.name}`)
          .join('\n'),
        markingRubric: `1 Mark for each correctly labeled and identified anatomical / schematic component. Total: ${marks} Marks.`,
        sourcePage: page.pageNumber,
      };

      onInsertQuestion(newQuestion, targetSectionId);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onClose();
    } catch (err) {
      console.error('Error generating diagram question:', err);
      alert(`Could not generate diagram question: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Diagram Labeling Question Studio</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Page {page.pageNumber} Visuals
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Crop the diagram, place label pins (A, B, C, D) by clicking, and insert student blanks directly into your paper!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY: 2 COLUMNS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: INTERACTIVE DIAGRAM CANVAS WITH PINS (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            
            {/* Crop Preset Selector */}
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Crop className="w-3.5 h-3.5 text-indigo-400" />
                <span>Crop Focus:</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCropPresetChange('full')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    cropPreset === 'full'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Full Page
                </button>
                <button
                  type="button"
                  onClick={() => handleCropPresetChange('top')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    cropPreset === 'top'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Top Diagram
                </button>
                <button
                  type="button"
                  onClick={() => handleCropPresetChange('center')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    cropPreset === 'center'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Center Region
                </button>
                <button
                  type="button"
                  onClick={() => handleCropPresetChange('bottom')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    cropPreset === 'bottom'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Bottom Region
                </button>
              </div>
            </div>

            {/* Click-to-Pin Canvas Container */}
            <div className="relative border-2 border-indigo-500/40 rounded-2xl overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center min-h-[340px]">
              {page.dataUrl ? (
                <div
                  ref={containerRef}
                  onClick={handleDiagramClick}
                  className="relative w-full h-full cursor-crosshair select-none flex items-center justify-center p-2"
                  style={{ minHeight: '340px', maxHeight: '420px' }}
                >
                  <img
                    src={page.dataUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="max-h-[400px] w-auto max-w-full object-contain rounded-lg pointer-events-none"
                    style={{
                      clipPath: cropPreset !== 'full'
                        ? `polygon(${cropRegion.x}% ${cropRegion.y}%, ${cropRegion.x + cropRegion.width}% ${cropRegion.y}%, ${cropRegion.x + cropRegion.width}% ${cropRegion.y + cropRegion.height}%, ${cropRegion.x}% ${cropRegion.y + cropRegion.height}%)`
                        : 'none',
                    }}
                  />

                  {/* Render Pins (A, B, C, D) over diagram */}
                  {labels.map((lbl, idx) => {
                    const isActive = idx === activeLabelIndex;
                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLabelIndex(idx);
                        }}
                        style={{
                          left: `${lbl.x}%`,
                          top: `${lbl.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute z-20 cursor-pointer group flex items-center justify-center transition-transform ${
                          isActive ? 'scale-125 z-30' : 'hover:scale-110'
                        }`}
                        title={`Pin (${lbl.letter}): ${lbl.name}. Click to select & move`}
                      >
                        {/* Badge */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xl font-black text-xs text-white border-2 border-white transition ${
                          isActive
                            ? 'bg-gradient-to-tr from-rose-600 to-amber-500 ring-4 ring-rose-500/40 animate-bounce'
                            : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}>
                          {lbl.letter}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700 pointer-events-none shadow-lg">
                          ({lbl.letter}) {lbl.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs">No visual dataUrl found for Page {page.pageNumber}.</p>
                  <p className="text-[11px] text-slate-500">Please upload a visual PDF or image page.</p>
                </div>
              )}

              {/* Pinning Helper Hint */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300 pointer-events-none">
                <span>
                  🎯 Currently moving Pin <strong>({labels[activeLabelIndex]?.letter})</strong>. Click anywhere on the diagram to place it!
                </span>
                <span className="text-indigo-400 font-semibold">{labels.length} Pins Placed</span>
              </div>
            </div>

            {/* Presets Quick-Bar */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Quick Subject Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_DIAGRAM_TOPICS.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(tmpl)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LABELS CONFIG & MARKING KEY (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                  Diagram Labels & Answers
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                title="Add another labeled pin"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pin</span>
              </button>
            </div>

            {/* Labels Input List */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {labels.map((lbl, idx) => {
                const isActive = idx === activeLabelIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveLabelIndex(idx)}
                    className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {lbl.letter}
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={lbl.name}
                        onChange={(e) => updateLabelName(idx, e.target.value)}
                        placeholder={`Correct name for (${lbl.letter})...`}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono shrink-0">
                      {lbl.x}%, {lbl.y}%
                    </div>

                    {labels.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLabel(idx);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete this pin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Question Text & Marks */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Question Prompt (for Students):
                </label>
                <textarea
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Total Marks:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Insert Into Section:
                  </label>
                  <select
                    value={targetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleInsert}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center gap-2 transition transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Add Question to Paper Now</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
