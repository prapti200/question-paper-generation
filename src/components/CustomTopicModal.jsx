import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
} from 'lucide-react';

export default function CustomTopicModal({
  isOpen,
  onClose,
  chapters = [],
  pages = [],
  activePageNumber = 1,
  onAddCustomTopic,
}) {
  const [topicName, setTopicName] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState(chapters[0]?.id || '');
  const [newChapterName, setNewChapterName] = useState('');
  const [pageNumber, setPageNumber] = useState(activePageNumber);
  const [customNotes, setCustomNotes] = useState('');
  const [focusType, setFocusType] = useState('comprehensive'); // 'comprehensive' | 'theory' | 'diagram' | 'numerical'

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topicName.trim()) {
      alert('Please enter a topic name.');
      return;
    }

    let finalChapterId = selectedChapterId;
    let finalChapterName = chapters.find((c) => c.id === selectedChapterId)?.name || 'Custom Chapter';

    if (selectedChapterId === 'new') {
      if (!newChapterName.trim()) {
        alert('Please enter a name for the new chapter.');
        return;
      }
      finalChapterId = `ch-custom-${Date.now()}`;
      finalChapterName = newChapterName.trim();
    }

    const newTopic = {
      id: `topic-custom-${Date.now()}`,
      name: topicName.trim(),
      cleanName: topicName.trim(),
      chapterId: finalChapterId,
      chapterName: finalChapterName,
      pageNumber: Number(pageNumber) || 1,
      snippet: customNotes.trim() || `Teacher custom topic: ${topicName.trim()}`,
      selected: true,
      isCustom: true,
      customNotes: customNotes.trim(),
      focusType,
    };

    onAddCustomTopic(newTopic, selectedChapterId === 'new' ? { id: finalChapterId, name: finalChapterName, pages: [Number(pageNumber)] } : null);
    setTopicName('');
    setCustomNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Add Customized Topic for Teacher
              </h3>
              <p className="text-xs text-slate-400">
                Define your own customized topic on any page of this PDF
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

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">

          {/* Topic Name */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Custom Topic Title <span className="text-rose-400">*</span>:
            </label>
            <input
              type="text"
              required
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g. Pathogens, Symptoms and Preventive Vaccines"
              className="w-full bg-slate-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Chapter Selector (Strictly Side-by-Side) */}
          <div
            className="grid grid-cols-2 gap-4"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '1rem'
            }}
          >
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Parent Chapter:
              </label>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full bg-slate-950 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
              >
                {chapters.map((chap) => (
                  <option key={chap.id} value={chap.id}>
                    {chap.name}
                  </option>
                ))}
                <option value="new">➕ + Create New Chapter...</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Target Page of this Topic:
              </label>
              <select
                value={pageNumber}
                onChange={(e) => setPageNumber(Number(e.target.value))}
                className="w-full bg-slate-950 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
              >
                {pages.map((p) => (
                  <option key={p.pageNumber} value={p.pageNumber}>
                    Page {p.pageNumber} {p.pageNumber === activePageNumber ? '(Current Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* If New Chapter chosen */}
          {selectedChapterId === 'new' && (
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                New Chapter Name:
              </label>
              <input
                type="text"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                placeholder="e.g. Chapter 1: Chemical Reactions & Equations"
                className="w-full bg-slate-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          )}

          {/* Teacher's Notes & Question Preferences */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span>Teacher Instructions for AI (What should questions test?):</span>
              <span className="text-[10px] text-indigo-400 font-normal">Optional</span>
            </label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. 'Focus on difference between infectious and non-infectious diseases. Include a 3-mark question on BCG vaccination and typhoid diagnosis.'"
              className="w-full bg-slate-950 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
          </div>

          {/* Focus Type Pill Selector */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Testing Focus:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'comprehensive', label: 'Balanced (All)' },
                { id: 'diagram', label: '🖼️ Diagram & Visual' },
                { id: 'theory', label: '📖 Theory & Definitions' },
                { id: 'numerical', label: '🔢 Calculation & Formulas' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFocusType(f.id)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center ${focusType === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-3 flex items-center justify-end gap-3" style={{ gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center gap-1.5 transition transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save & Select Custom Topic</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
