import React from 'react';
import { Variable, Plus, X } from 'lucide-react';

interface VariableInputsPanelProps {
  variables: string[];
  values: Record<string, string>;
  onChangeValue: (varName: string, value: string) => void;
  onAddVariable: (varName: string) => void;
  onClearValues: () => void;
}

export const VariableInputsPanel: React.FC<VariableInputsPanelProps> = ({
  variables,
  values,
  onChangeValue,
  onAddVariable,
  onClearValues
}) => {
  const [newVarInput, setNewVarInput] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  const handleCreate = () => {
    const clean = newVarInput.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (clean) {
      onAddVariable(clean);
      setNewVarInput('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/20 rounded-xl p-3.5 space-y-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
            <Variable className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Biến Động (Dynamic Variables)
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
            {variables.length} biến
          </span>
        </div>

        <div className="flex items-center gap-2">
          {variables.length > 0 && (
            <button
              type="button"
              onClick={onClearValues}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
            >
              Đặt lại giá trị
            </button>
          )}

          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Chèn biến</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newVarInput}
                onChange={(e) => setNewVarInput(e.target.value)}
                placeholder="ten_bien"
                className="w-24 px-2 py-0.5 text-xs bg-slate-950 border border-indigo-500 rounded text-white focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreate}
                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {variables.length === 0 ? (
        <div className="text-xs text-slate-400 flex items-center justify-between py-1">
          <span>Chưa phát hiện biến nào. Bạn có thể gõ cú pháp <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono">{"{{ten_bien}}"}</code> vào prompt để tạo biến động.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {variables.map((v) => (
            <div key={v} className="space-y-1">
              <label className="text-[11px] font-mono text-indigo-300 flex items-center gap-1">
                <span>{"{{"}</span>
                <span className="font-semibold text-white">{v}</span>
                <span>{"}}"}</span>
              </label>
              <input
                type="text"
                value={values[v] || ''}
                onChange={(e) => onChangeValue(v, e.target.value)}
                placeholder={`Nhập giá trị cho ${v}...`}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
