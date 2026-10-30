import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Cpu,
  Lock
} from 'lucide-react';
import { fetchApiConfig, saveApiConfig } from '../utils/backendApi';

export default function ApiKeyModal({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
}) {
  const [inputKey, setInputKey] = useState('');
  const [hasServerKey, setHasServerKey] = useState(false);
  const [scanModel, setScanModel] = useState('gemini-3.8-flash');
  const [mcqModel, setMcqModel] = useState('gemini-3.8-flash');
  const [finalModel, setFinalModel] = useState('gemini-3.8-flash');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch server config from .env
      fetchApiConfig().then((cfg) => {
        if (cfg) {
          setHasServerKey(Boolean(cfg.hasApiKey));
          if (cfg.scanModel) setScanModel(cfg.scanModel);
          if (cfg.mcqModel) setMcqModel(cfg.mcqModel);
          if (cfg.finalModel) setFinalModel(cfg.finalModel);
        }
      });
      setTestResult(null);
      setInputKey('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        scanModel,
        mcqModel,
        finalModel,
      };

      if (inputKey.trim()) {
        updates.apiKey = inputKey.trim();
      }

      const res = await saveApiConfig(updates);
      if (res && res.hasApiKey) {
        setHasServerKey(true);
        if (setApiKey) setApiKey('CONFIGURED_IN_ENV');
      }
      onClose();
    } catch (err) {
      alert('Failed to save to .env: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const testKey = inputKey.trim();
      if (!testKey && !hasServerKey) {
        throw new Error('Please enter a Gemini API key or configure it in .env');
      }

      // If key is being entered, test directly; otherwise test via server
      const keyToUse = testKey;
      if (keyToUse) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${scanModel}:generateContent?key=${encodeURIComponent(keyToUse)}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': keyToUse
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with JSON {"status": "ok"}' }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API responded with code ${response.status}: ${errorText.slice(0, 150)}`);
        }
      }

      setTestResult({
        success: true,
        msg: `Connection successful! ${scanModel} and ${finalModel} are active.`,
      });
    } catch (err) {
      setTestResult({
        success: false,
        msg: `Connection failed: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Gemini API & Model Settings</h2>
              <p className="text-xs text-slate-400">Stored safely in <code className="text-indigo-300">.env</code> on your local system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
            hasServerKey
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            {hasServerKey ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {hasServerKey ? '✓ GEMINI_API_KEY is active in .env' : '⚠️ No Gemini API key detected in .env'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasServerKey
                  ? 'Your API key is securely loaded by the local server and never exposed to the client.'
                  : 'Enter your key below to save it directly to .env on your computer.'}
              </p>
            </div>
          </div>

          {/* Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder={hasServerKey ? '•••••••••••••••••••••••••••••••• (Leave blank to keep existing)' : 'Paste AQ... or AIzaSy... key here'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
            />
          </div>

          {/* Configurable Model Selection from .env */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Configured Models (.env)
            </span>

            {/* Fast Scan Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  ⚡ Fast Scan Model (PDF & MCQs)
                </label>
                <select
                  value={scanModel}
                  onChange={(e) => {
                    setScanModel(e.target.value);
                    setMcqModel(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Latest Official & Recommended)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Standard)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Lightweight)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning)</option>
                </select>
              </div>

              {/* Stronger Final Paper Model */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  🧠 Final Paper Model
                </label>
                <select
                  value={finalModel}
                  onChange={(e) => setFinalModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Latest Official & Recommended)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Standard)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Stronger Reasoning)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                </select>
              </div>
            </div>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{testResult.msg}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/50 border-t border-slate-800">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testing}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {testing ? (
              <>
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? 'Saving to .env...' : 'Save Configuration'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
