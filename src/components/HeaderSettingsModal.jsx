import React, { useState } from 'react';
import { 
  X, 
  School, 
  Upload, 
  Droplet, 
  FileText, 
  User, 
  Clock, 
  Award, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';

const PRESET_LOGOS = [
  {
    name: 'Academic Shield',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=160&q=80'
  },
  {
    name: 'University Crest',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=160&q=80'
  },
  {
    name: 'Science Atom',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=160&q=80'
  }
];

export default function HeaderSettingsModal({
  isOpen,
  onClose,
  headerConfig,
  setHeaderConfig,
  calculatedTotalMarks,
}) {
  const [activeTab, setActiveTab] = useState('school'); // 'school', 'watermark', 'instructions', 'students'
  const [newInstruction, setNewInstruction] = useState('');

  if (!isOpen) return null;

  const updateHeader = (fields) => {
    setHeaderConfig((prev) => ({
      ...prev,
      ...fields,
    }));
  };

  const updateWatermark = (fields) => {
    setHeaderConfig((prev) => ({
      ...prev,
      watermark: {
        ...prev.watermark,
        ...fields,
      },
    }));
  };

  const updateStudentFields = (fields) => {
    setHeaderConfig((prev) => ({
      ...prev,
      studentFields: {
        ...prev.studentFields,
        ...fields,
      },
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateHeader({ logoUrl: event.target.result, showLogo: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const addInstruction = () => {
    if (!newInstruction.trim()) return;
    updateHeader({
      instructions: [...headerConfig.instructions, newInstruction.trim()],
    });
    setNewInstruction('');
  };

  const removeInstruction = (index) => {
    updateHeader({
      instructions: headerConfig.instructions.filter((_, i) => i !== index),
    });
  };

  const applyCBSEInstructions = () => {
    updateHeader({
      instructions: [
        "This question paper consists of 39 questions in 5 sections.",
        "Section A consists of 20 Objective Type questions carrying 1 mark each.",
        "Section B consists of 6 Very Short Answer questions carrying 2 marks each.",
        "Section C consists of 7 Short Answer questions carrying 3 marks each.",
        "Section D consists of 3 Long Answer questions carrying 5 marks each.",
        "Section E consists of 3 Source-based / Case-based units of assessment carrying 4 marks each.",
        "All questions are compulsory. Internal choices are provided in certain questions.",
        "There is no overall choice, however, internal choices have been provided in some questions."
      ]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Question Paper Header & Branding</h2>
              <p className="text-xs text-slate-400">Configure institution branding, logo, watermark, and exam rubrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('school')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'school'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Institution & Details</span>
          </button>
          
          <button
            onClick={() => setActiveTab('watermark')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'watermark'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>Watermark & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'instructions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>General Instructions</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'students'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Student Metadata Box</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: School & Exam Details */}
          {activeTab === 'school' && (
            <div className="space-y-5">
              
              {/* Friendly Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
                <School className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-indigo-300">It is 100% up to you which School Name to give!</div>
                  <div className="text-slate-300 mt-0.5">
                    Type your school, college, tuition institute or coaching name below, or click any quick preset. It will automatically update the printed examination paper header and background watermark.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>School / College / Institution Name</span>
                    <span className="text-[11px] text-indigo-400 font-medium">Any name can be given</span>
                  </label>
                  <input
                    type="text"
                    value={headerConfig.schoolName}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateHeader({
                        schoolName: val,
                        watermark: {
                          ...headerConfig.watermark,
                          text: val || headerConfig.watermark.text,
                        }
                      });
                    }}
                    placeholder="e.g. DELHI PUBLIC SCHOOL, KENDRIYA VIDYALAYA, ST. XAVIER'S..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                  />

                  {/* Quick School Presets */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Popular Presets:</span>
                    {[
                      "DELHI PUBLIC SCHOOL",
                      "KENDRIYA VIDYALAYA",
                      "ST. XAVIER'S HIGH SCHOOL",
                      "ARMY PUBLIC SCHOOL",
                      "DAV PUBLIC SCHOOL",
                      "CAMBRIDGE INTERNATIONAL",
                      "DON BOSCO ACADEMY"
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateHeader({
                          schoolName: preset,
                          watermark: {
                            ...headerConfig.watermark,
                            text: preset,
                          }
                        })}
                        className={`text-[10px] px-2.5 py-1 rounded-md border transition ${
                          headerConfig.schoolName === preset
                            ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Education Board & Affiliation / Sub-Header
                    </label>
                    <span className="text-[10px] text-indigo-400 font-medium">Select or Type Custom Board</span>
                  </div>
                  <input
                    type="text"
                    value={headerConfig.affiliation || ''}
                    onChange={(e) => updateHeader({ affiliation: e.target.value, board: e.target.value })}
                    placeholder="e.g. Affiliated to CBSE, New Delhi | Senior Secondary"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { name: 'CBSE', text: 'Affiliated to CBSE, New Delhi' },
                      { name: 'ICSE / ISC', text: 'Affiliated to CISCE (ICSE / ISC), New Delhi' },
                      { name: 'Maharashtra Board', text: 'Affiliated to Maharashtra State Board (MSBSHSE)' },
                      { name: 'UP Board', text: 'Affiliated to UP Board (UPMSP), Prayagraj' },
                      { name: 'Karnataka Board', text: 'Affiliated to Karnataka Board (KSEAB)' },
                      { name: 'Tamil Nadu Board', text: 'Affiliated to Tamil Nadu State Board' },
                      { name: 'Cambridge / IGCSE', text: 'Cambridge Assessment International Education (IGCSE)' },
                      { name: 'IB World School', text: 'International Baccalaureate (IB) World School' },
                      { name: 'State Board', text: 'Affiliated to State Board of Secondary Education' },
                    ].map((b) => (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => updateHeader({ affiliation: b.text, board: b.name })}
                        className={`text-[10px] px-2.5 py-1 rounded-md border transition cursor-pointer ${
                          headerConfig.affiliation === b.text
                            ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        + {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Examination Title
                  </label>
                  <input
                    type="text"
                    value={headerConfig.examTitle}
                    onChange={(e) => updateHeader({ examTitle: e.target.value })}
                    placeholder="e.g. ANNUAL EXAMINATION 2025-2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subject Name & Code
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={headerConfig.subject}
                      onChange={(e) => updateHeader({ subject: e.target.value })}
                      placeholder="e.g. SCIENCE"
                      className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={headerConfig.subjectCode}
                      onChange={(e) => updateHeader({ subjectCode: e.target.value })}
                      placeholder="Code (086)"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Class / Grade & Section
                  </label>
                  <input
                    type="text"
                    value={headerConfig.grade}
                    onChange={(e) => updateHeader({ grade: e.target.value })}
                    placeholder="e.g. Class X - Section A, B & C"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Teacher / Faculty In-Charge
                  </label>
                  <input
                    type="text"
                    value={headerConfig.facultyName}
                    onChange={(e) => updateHeader({ facultyName: e.target.value })}
                    placeholder="e.g. Dr. Ananya Sharma (PGT Physics)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Time Allowed & Maximum Marks
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={headerConfig.duration}
                      onChange={(e) => updateHeader({ duration: e.target.value })}
                      placeholder="e.g. 3 Hours"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={headerConfig.autoCalculateMarks ? calculatedTotalMarks : headerConfig.maxMarks}
                        onChange={(e) => updateHeader({ maxMarks: Number(e.target.value), autoCalculateMarks: false })}
                        disabled={headerConfig.autoCalculateMarks}
                        placeholder="e.g. 80"
                        className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 ${
                          headerConfig.autoCalculateMarks ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      />
                      <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-medium">
                        Marks
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerConfig.autoCalculateMarks}
                      onChange={(e) => updateHeader({ autoCalculateMarks: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Auto-calculate Max Marks from questions ({calculatedTotalMarks} marks)</span>
                  </label>
                </div>
              </div>

              {/* Logo Settings */}
              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200">School / Institution Logo</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerConfig.showLogo}
                      onChange={(e) => updateHeader({ showLogo: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Show Logo on Paper</span>
                  </label>
                </div>

                {headerConfig.showLogo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-4">
                      {headerConfig.logoUrl ? (
                        <img
                          src={headerConfig.logoUrl}
                          alt="School Logo"
                          className="w-16 h-16 rounded-lg object-contain bg-white p-1 border border-slate-700 shadow"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs text-center p-1">
                          No Logo
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer transition shadow">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload School Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-slate-400">PNG, JPG, or SVG recommended</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Or pick a sample educational emblem:
                      </label>
                      <div className="flex gap-2">
                        {PRESET_LOGOS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => updateHeader({ logoUrl: p.url, showLogo: true })}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Watermark */}
          {activeTab === 'watermark' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Droplet className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-sm font-semibold text-slate-100">Anti-Leak & Branding Watermark</span>
                      <p className="text-xs text-slate-400">Renders seamlessly in paper background and on export</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerConfig.watermark.enabled}
                      onChange={(e) => updateWatermark({ enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {headerConfig.watermark.enabled && (
                  <div className="space-y-4 pt-3 border-t border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Watermark Text
                        </label>
                        <input
                          type="text"
                          value={headerConfig.watermark.text}
                          onChange={(e) => updateWatermark({ text: e.target.value })}
                          placeholder="e.g. DPS CONFIDENTIAL / SAMPLE PAPER"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Quick Preset Texts
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {['CONFIDENTIAL', 'SAMPLE PAPER', 'INTERNAL ASSESSMENT', headerConfig.schoolName.slice(0, 18)].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => updateWatermark({ text: t })}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Opacity</span>
                          <span>{Math.round(headerConfig.watermark.opacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.03"
                          max="0.30"
                          step="0.01"
                          value={headerConfig.watermark.opacity}
                          onChange={(e) => updateWatermark({ opacity: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Rotation Angle</span>
                          <span>{headerConfig.watermark.angle}°</span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="0"
                          step="5"
                          value={headerConfig.watermark.angle}
                          onChange={(e) => updateWatermark({ angle: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Font Size</span>
                          <span>{headerConfig.watermark.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="72"
                          step="2"
                          value={headerConfig.watermark.fontSize}
                          onChange={(e) => updateWatermark({ fontSize: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Live Watermark Mini Preview Box */}
                    <div className="mt-3 p-6 bg-white rounded-xl relative overflow-hidden border border-slate-700 flex items-center justify-center min-h-[90px]">
                      <div
                        className="select-none pointer-events-none font-black text-center tracking-widest text-slate-900"
                        style={{
                          opacity: headerConfig.watermark.opacity * 2.5,
                          transform: `rotate(${headerConfig.watermark.angle}deg)`,
                          fontSize: `${headerConfig.watermark.fontSize * 0.55}px`,
                        }}
                      >
                        {headerConfig.watermark.text || 'WATERMARK'}
                      </div>
                      <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-mono">
                        (Live paper preview simulator)
                      </span>
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: General Instructions */}
          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Examination General Instructions ({headerConfig.instructions.length} items)
                </span>
                <button
                  type="button"
                  onClick={applyCBSEInstructions}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Reset to Standard CBSE Format</span>
                </button>
              </div>

              {/* Add Instruction Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addInstruction()}
                  placeholder="Type new general instruction and press Enter..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addInstruction}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Instruction list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {headerConfig.instructions.map((inst, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2.5 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl group hover:border-slate-700"
                  >
                    <span className="text-xs font-bold text-indigo-400 w-5 pt-0.5">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={inst}
                      onChange={(e) => {
                        const updated = [...headerConfig.instructions];
                        updated[index] = e.target.value;
                        updateHeader({ instructions: updated });
                      }}
                      className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Student Details Box */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Choose which candidate credential boxes should be printed at the top of the question paper for students to fill in:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'showRollNo', label: "Roll No. Box [________]" },
                  { key: 'showStudentName', label: "Student's Full Name [___________________]" },
                  { key: 'showSection', label: "Section / Batch [____]" },
                  { key: 'showDate', label: "Date of Examination [DD / MM / YYYY]" },
                  { key: 'showInvigilatorSign', label: "Invigilator's Signature & Verification Box" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={headerConfig.studentFields?.[key] ?? true}
                      onChange={(e) => updateStudentFields({ [key]: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200 font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <span className="text-xs text-slate-400">
            Changes are saved automatically to your question paper draft.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            Save & Done
          </button>
        </div>

      </div>
    </div>
  );
}
