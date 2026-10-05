import React, { useRef, useState } from 'react';
import type { TestCase, BatchEvaluationSummary, AssertionType } from '../types';
import { generateStarterTestCases, runBatchEvaluation } from '../services/batchEvaluator';
import {
  X,
  Layers,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Download
} from 'lucide-react';

interface BatchEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptTemplate: string;
  variables: string[];
}

export const BatchEvaluationModal: React.FC<BatchEvaluationModalProps> = ({
  isOpen,
  onClose,
  promptTemplate,
  variables
}) => {
  const [testCases, setTestCases] = useState<TestCase[]>(() => generateStarterTestCases(variables));
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summary, setSummary] = useState<BatchEvaluationSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'cases'>('cases');
  const [runError, setRunError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const handleRunBatch = async () => {
    if (testCases.length === 0) return;
    setIsRunning(true);
    setRunError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress({ current: 0, total: testCases.length });

    try {
      const res = await runBatchEvaluation(
        promptTemplate,
        testCases,
        (current, total) => setProgress({ current, total }),
        controller.signal
      );
      setSummary(res);
      setActiveTab('matrix');
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Batch evaluation thất bại.');
    } finally {
      if (abortRef.current === controller) { abortRef.current = null; setIsRunning(false); }
    }
  };
  const handleClose = () => { abortRef.current?.abort(); abortRef.current = null; setIsRunning(false); onClose(); };

  const handleAddTestCase = () => {
    const vars: Record<string, string> = {};
    for (const v of variables) {
      vars[v] = `Giá trị mẫu cho ${v}`;
    }
    const newCase: TestCase = {
      id: `tc-${Date.now()}`,
      name: `Bộ kiểm thử #${testCases.length + 1}`,
      variables: vars,
      assertionType: 'min_length',
      expectedValue: '50'
    };
    setTestCases((prev) => [...prev, newCase]);
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const handleUpdateTestCase = (
    id: string,
    field: 'name' | 'assertionType' | 'expectedValue',
    val: string
  ) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, [field]: val } : tc))
    );
  };

  const handleUpdateVariable = (id: string, varKey: string, val: string) => {
    setTestCases((prev) =>
      prev.map((tc) =>
        tc.id === id
          ? { ...tc, variables: { ...tc.variables, [varKey]: val } }
          : tc
      )
    );
  };

  const handleRegenerateStarter = () => {
    setTestCases(generateStarterTestCases(variables));
  };

  const handleExportResultsJson = () => {
    if (!summary) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lprompt_batch_eval_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white m-0">
                  Batch Evaluation & Test Suite Runner
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Kiểm thử hàng loạt bộ dữ liệu đầu vào, thẩm định assertions và đo lường tỷ lệ Pass/Fail theo chuẩn Promptfoo & Langfuse
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Run Toolbar */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'cases'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Bộ Kiểm Thử ({testCases.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              disabled={!summary}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40'
              }`}
            >
              Ma Trận Kết Quả {summary ? `(${summary.passRate}% Pass)` : ''}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {summary && (
              <button
                onClick={handleExportResultsJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title="Xuất báo cáo kết quả ra JSON"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Xuất JSON</span>
              </button>
            )}

            <button
              onClick={handleRunBatch}
              disabled={isRunning || testCases.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Đang chạy {progress.current}/{progress.total}...
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Chạy Toàn Bộ Test Suite</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'cases' ? (
            /* TAB 1: TEST CASES CONFIG */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Cấu Hình Tập Dữ Liệu Kiểm Thử (Dataset Cases)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerateStarter}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    title="Tự động sinh lại bộ kiểm thử từ các biến template"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-400" />
                    <span>Tự Động Sinh Test</span>
                  </button>
                  <button
                    onClick={handleAddTestCase}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Case</span>
                  </button>
                </div>
              </div>

              {testCases.map((tc, idx) => (
                <div
                  key={tc.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={tc.name}
                        onChange={(e) => handleUpdateTestCase(tc.id, 'name', e.target.value)}
                        className="bg-transparent font-semibold text-xs text-white focus:outline-none focus:border-b focus:border-indigo-400 flex-1"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveTestCase(tc.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="Xóa case này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Variables for this test case */}
                  {variables.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      {variables.map((v) => (
                        <div key={v} className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-purple-300 font-bold">
                            {`{{${v}}}`}
                          </span>
                          <input
                            type="text"
                            value={tc.variables[v] || ''}
                            onChange={(e) => handleUpdateVariable(tc.id, v, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            placeholder={`Nhập giá trị cho ${v}...`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assertion Rules */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 text-[11px] font-semibold">Quy tắc kiểm tra:</span>
                    <select
                      value={tc.assertionType}
                      onChange={(e) =>
                        handleUpdateTestCase(tc.id, 'assertionType', e.target.value as AssertionType)
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="contains">Chứa từ khóa (Contains)</option>
                      <option value="not_contains">Không chứa từ cấm (Not Contains)</option>
                      <option value="regex">Khớp Regex (Regular Expression)</option>
                      <option value="min_length">Độ dài tối thiểu ký tự (Min Length)</option>
                    </select>

                    <input
                      type="text"
                      value={tc.expectedValue}
                      onChange={(e) => handleUpdateTestCase(tc.id, 'expectedValue', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      placeholder="Giá trị kỳ vọng..."
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TAB 2: MATRIX RESULTS */
            summary && (
              <div className="space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Tỷ Lệ Thành Công</span>
                    <div className="text-2xl font-extrabold text-emerald-400">
                      {summary.passRate}%
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {summary.passedTests}/{summary.totalTests} pass
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Độ Trễ Trung Bình</span>
                    <div className="text-2xl font-extrabold text-sky-400 flex items-center gap-1">
                      <Clock className="w-5 h-5 text-sky-400" />
                      <span>{summary.avgLatencyMs}ms</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Mỗi lượt gọi</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Thành Công (Pass)</span>
                    <div className="text-2xl font-extrabold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{summary.passedTests}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Đạt mọi assertion</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Thất Bại (Fail)</span>
                    <div className="text-2xl font-extrabold text-rose-400 flex items-center gap-1">
                      <XCircle className="w-5 h-5" />
                      <span>{summary.failedTests}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Cần tinh chỉnh prompt</span>
                  </div>
                </div>

                {/* Results Matrix Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Trạng Thái</th>
                        <th className="p-3">Tên Test Case</th>
                        <th className="p-3">Độ Trễ</th>
                        <th className="p-3">Lý Do Đánh Giá</th>
                        <th className="p-3">Đầu Ra AI Thực Tế</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                      {summary.results.map((r) => (
                        <tr key={r.testCaseId} className="hover:bg-slate-800/40">
                          <td className="p-3 whitespace-nowrap">
                            {r.status === 'pass' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> PASS
                              </span>
                            ) : r.status === 'fail' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3 h-3" /> FAIL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <AlertTriangle className="w-3 h-3" /> ERROR
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-white whitespace-nowrap">
                            {r.testCaseName}
                          </td>
                          <td className="p-3 text-sky-400 whitespace-nowrap">
                            {r.latencyMs}ms
                          </td>
                          <td className="p-3 text-slate-300 min-w-[200px]">
                            {r.reason}
                          </td>
                          <td className="p-3 text-slate-400 max-w-xs truncate" title={r.actualOutput}>
                            {r.actualOutput || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>

        {runError && <div className="mx-4 mb-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{runError}</div>}
        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Chế độ: kiểm thử cấu trúc cục bộ, không gọi API
          </span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
