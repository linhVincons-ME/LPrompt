import React, { useState } from 'react';
import type { GeminiConfig } from '../types';
import { X, Key, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GEMINI_MODELS } from '../services/modelCatalog';
import { generateGeminiContent } from '../services/geminiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GeminiConfig;
  onSaveConfig: (config: GeminiConfig) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, config, onSaveConfig }) => {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [temperature, setTemperature] = useState(config.temperature);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestStatus('error');
      setErrorMessage('Vui lòng nhập API Key trước khi kiểm tra.');
      return;
    }

    setTestStatus('testing');
    setErrorMessage('');

    try {
      await generateGeminiContent('Ping test. Reply with exactly: OK', { apiKey, model, temperature, timeoutMs: 10000 });
      setTestStatus('success');
    } catch (err: any) {
      setTestStatus('error');
      setErrorMessage(err.message || 'Không thể kết nối đến Gemini API');
    }
  };

  const handleSave = () => {
    onSaveConfig({ apiKey, model, temperature });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cấu Hình Gemini Engine (BYOK)</h3>
              <p className="text-xs text-slate-400">Tự do sử dụng API Key cá nhân - Không lo lộ dữ liệu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {/* Free Tier Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
            <span className="text-base">💡</span>
            <div>
              <span className="font-semibold">Mẹo:</span> Bạn có thể tạo Gemini API Key tại{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-emerald-200 inline-flex items-center gap-0.5 hover:text-white"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>.
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Google Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">API Key được lưu cục bộ và gửi trực tiếp từ trình duyệt tới Google Gemini API; LPrompt Service không lưu hoặc trung chuyển khóa.</p>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Model Gemini Sử Dụng</label>
            <div className="grid grid-cols-1 gap-2">
              {GEMINI_MODELS.map((availableModel) => (
                <label
                  key={availableModel.id}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    model === availableModel.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-2">
                      <span>{availableModel.id}</span>
                      {availableModel.recommended && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Khuyên dùng</span>}
                      {availableModel.preview && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">Preview</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">{availableModel.description}</div>
                  </div>
                  <input
                    type="radio"
                    name="model"
                    checked={model === availableModel.id}
                    onChange={() => setModel(availableModel.id)}
                    className="accent-indigo-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Temperature slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Nhiệt độ sáng tạo (Temperature)</label>
              <span className="font-mono text-indigo-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Test Status feedback */}
          {testStatus === 'testing' && (
            <div className="p-2.5 rounded-xl bg-slate-950 text-indigo-400 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang kiểm tra kết nối API Key...</span>
            </div>
          )}
          {testStatus === 'success' && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Kết nối API thành công! Sẵn sàng sử dụng.</span>
            </div>
          )}
          {testStatus === 'error' && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="break-all">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            Kiểm tra kết nối
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
