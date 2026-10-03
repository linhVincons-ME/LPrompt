import React from 'react';
import type { PromptDomain } from '../types';
import { Camera, Film, Code, Music, Search, PlusCircle } from 'lucide-react';

interface DomainToolbarProps {
  domain: PromptDomain;
  onInsertTag: (tag: string) => void;
}

export const DomainToolbar: React.FC<DomainToolbarProps> = ({ domain, onInsertTag }) => {
  if (domain === 'image') {
    const aspectRatios = ['--ar 16:9', '--ar 9:16', '--ar 1:1', '--ar 21:9', '--ar 4:3'];
    const lenses = ['85mm portrait lens', '35mm street photography', '16mm ultra-wide angle', 'Macro 100mm'];
    const lightings = ['Volumetric cinematic lighting', 'Golden hour sunlight', 'Dramatic chiaroscuro', 'Studio softbox rim light'];

    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 mr-2">
          <Camera className="w-3.5 h-3.5 text-pink-400" />
          <span>Gợi ý chèn nhanh:</span>
        </span>

        {/* Aspect Ratios */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase px-1">Tỷ lệ:</span>
          {aspectRatios.map((ar) => (
            <button
              key={ar}
              onClick={() => onInsertTag(` ${ar}`)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-pink-500/20 hover:text-pink-300 text-slate-300 transition-colors"
            >
              {ar.replace('--ar ', '')}
            </button>
          ))}
        </div>

        {/* Lenses */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase px-1">Lens:</span>
          {lenses.slice(0, 2).map((l) => (
            <button
              key={l}
              onClick={() => onInsertTag(`\n[CAMERA]: Shot on ${l}`)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-300 transition-colors"
            >
              {l.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Lighting */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase px-1">Ánh sáng:</span>
          {lightings.slice(0, 2).map((light) => (
            <button
              key={light}
              onClick={() => onInsertTag(`\n[LIGHTING]: ${light}`)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 transition-colors"
            >
              {light.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Negative preset */}
        <button
          onClick={() => onInsertTag('\n[NEGATIVE PROMPT]: lowres, bad anatomy, deformed limbs, watermark, artifacts, blurry')}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Khung Negative</span>
        </button>
      </div>
    );
  }

  if (domain === 'video') {
    const cameraMoves = ['Smooth Forward Dolly', 'Horizontal Pan Right', 'Dynamic FPV Dive', 'Slow Zoom In'];
    const specs = ['60fps ultra-fluid', '4K resolution', 'Motion speed 4/10', 'No warping glitches'];

    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 mr-2">
          <Film className="w-3.5 h-3.5 text-cyan-400" />
          <span>Camera & Motion:</span>
        </span>

        {cameraMoves.map((m) => (
          <button
            key={m}
            onClick={() => onInsertTag(`\n[CAMERA MOVEMENT]: ${m}`)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700/50 transition-colors"
          >
            {m}
          </button>
        ))}

        {specs.map((s) => (
          <button
            key={s}
            onClick={() => onInsertTag(` ${s}`)}
            className="px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    );
  }

  if (domain === 'code') {
    const stacks = ['Python 3.12 (Async)', 'TypeScript / Node.js', 'Golang Gin / Fiber', 'Rust Tokio'];
    const requirements = ['Clean Architecture', 'Pydantic V2 Validation', 'Unit Test Suite (Pytest/Jest)', 'Graceful Shutdown'];

    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 mr-2">
          <Code className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tech Stack & Tiêu chuẩn:</span>
        </span>

        {stacks.map((st) => (
          <button
            key={st}
            onClick={() => onInsertTag(`\n[TECH STACK]: ${st}`)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-slate-700/50 transition-colors"
          >
            {st}
          </button>
        ))}

        {requirements.map((req) => (
          <button
            key={req}
            onClick={() => onInsertTag(`\n- ${req}`)}
            className="px-2 py-1 rounded bg-slate-950/60 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
          >
            + {req}
          </button>
        ))}
      </div>
    );
  }

  if (domain === 'audio') {
    const tags = ['[Verse 1]', '[Chorus]', '[Guitar Solo]', '[Outro]', '72 BPM', 'Key of E Minor', 'Lo-Fi Vinyl'];
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 mr-2">
          <Music className="w-3.5 h-3.5 text-violet-400" />
          <span>Cấu trúc Nhạc & Thẻ Suno/Udio:</span>
        </span>

        {tags.map((t) => (
          <button
            key={t}
            onClick={() => onInsertTag(`\n${t}\n`)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-violet-500/20 hover:text-violet-300 text-slate-300 border border-slate-700/50 transition-colors font-mono"
          >
            {t}
          </button>
        ))}
      </div>
    );
  }

  // Research
  const frameworkTags = [
    'Phân tích SWOT & Rủi ro',
    'So sánh ma trận đối chiếu',
    'Executive Summary 3 gạch đầu dòng',
    'Trích dẫn số liệu định lượng',
    'Sơ đồ Mermaid Flowchart'
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-slate-400 font-medium flex items-center gap-1 mr-2">
        <Search className="w-3.5 h-3.5 text-indigo-400" />
        <span>Khung Luận Điểm Nghiên Cứu:</span>
      </span>

      {frameworkTags.map((ft) => (
        <button
          key={ft}
          onClick={() => onInsertTag(`\n- Yêu cầu: ${ft}`)}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-300 border border-slate-700/50 transition-colors"
        >
          + {ft}
        </button>
      ))}
    </div>
  );
};
