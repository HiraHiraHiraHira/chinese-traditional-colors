import { useEffect, useState } from 'react';
import type { CraftProfile, TraditionalColor } from '../../data/schema';
import { hexToRgb } from '../utils/color';
import { useGallery } from '../context/GalleryContext';

interface CraftAnalysisSectionProps {
  color: TraditionalColor;
  craft?: CraftProfile;
}

export function CraftAnalysisSection({ color, craft }: CraftAnalysisSectionProps) {
  const { copyText } = useGallery();
  const shades = color.shades ?? [];
  const defaultStep = craft?.sliderType === 'dye' ? Math.min(2, shades.length - 1) : Math.min(1, shades.length - 1);
  const [step, setStep] = useState(Math.max(0, defaultStep));

  useEffect(() => {
    const nextDefault =
      craft?.sliderType === 'dye'
        ? Math.min(2, Math.max(0, (color.shades?.length ?? 1) - 1))
        : Math.min(1, Math.max(0, (color.shades?.length ?? 1) - 1));
    setStep(nextDefault);
  }, [color.id, craft?.sliderType, color.shades?.length]);

  const currentShade = shades[step];
  const simRgb = currentShade ? hexToRgb(currentShade.hex) : null;

  const sliderHeading =
    craft?.sliderType === 'dye'
      ? '植物复染遍数模拟（1染 — 6染）'
      : craft?.sliderType === 'mineral'
        ? '矿物水飞颗粒分级（头色 — 四色）'
        : '瓷釉厚薄与窑变还原模拟';

  return (
    <div className="space-y-6">
      {/* 互动工艺色阶模拟器 */}
      {shades.length > 1 && currentShade && simRgb && (
        <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-5 fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-faint">
                PROCESS GRADATION SIMULATOR
              </div>
              <h2 className="font-serif text-lg font-semibold text-main mt-0.5">{sliderHeading}</h2>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full surface-subtle text-main self-start sm:self-auto">
              {currentShade.label}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6">
            {/* 当前阶段实时色块与色值 */}
            <div className="flex items-center gap-3.5 shrink-0">
              <div
                className="w-16 h-16 rounded-xl shadow-inner transition-colors duration-200 shrink-0"
                style={{
                  backgroundColor: currentShade.hex,
                  border: '1px solid rgba(128,128,128,0.18)',
                }}
              />
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => copyText(currentShade.hex, '工艺阶段 HEX', currentShade.hex)}
                  className="font-mono text-sm font-semibold text-main tabular-nums hover:underline underline-offset-4 block cursor-pointer"
                >
                  {currentShade.hex}
                </button>
                <div className="font-mono text-[11px] text-faint tabular-nums">
                  RGB {simRgb.r}, {simRgb.g}, {simRgb.b}
                </div>
              </div>
            </div>

            {/* 滑块与可点击色阶矩阵条 */}
            <div className="flex-1 space-y-3">
              <input
                type="range"
                min={0}
                max={shades.length - 1}
                step={1}
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
                className="gallery-slider w-full"
                style={{
                  background: `linear-gradient(to right, ${shades[0].hex}, ${shades[shades.length - 1].hex})`,
                }}
                aria-label={sliderHeading}
              />
              <div
                className={`grid gap-2.5 sm:gap-2 ${
                  shades.length >= 6
                    ? 'grid-cols-3 sm:grid-cols-6'
                    : shades.length === 4
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {shades.map((item, idx) => {
                  const isActive = idx === step;
                  return (
                    <button
                      key={`${item.label}-${idx}`}
                      type="button"
                      onClick={() => setStep(idx)}
                      className="text-left group space-y-1.5 cursor-pointer"
                    >
                      <div
                        className="h-6 rounded-md transition-all"
                        style={{
                          backgroundColor: item.hex,
                          border: '1px solid rgba(128,128,128,0.16)',
                          outline: isActive ? '2px solid var(--text-primary)' : 'none',
                          outlineOffset: '2px',
                        }}
                      />
                      <div className="text-[10px] font-mono text-faint truncate tabular-nums">
                        {item.hex}
                      </div>
                      <div className="text-[10px] text-muted truncate">
                        {item.label.split('（')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 制色工艺全解析 */}
      {craft ? (
        <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-8 fade-in">
          <div className="flex items-baseline justify-between pb-4 hairline-b gap-3 flex-wrap">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-faint">
                {color.provenance === 'verified'
                  ? 'VERIFIED HISTORICAL FORMULATION & CRAFT'
                  : 'INFERRED CRAFT PROFILE · SAME-FAMILY TRADITION'}
              </div>
              <h2 className="font-serif text-xl font-semibold text-main mt-0.5">
                「{color.name}」制色工艺全解析
              </h2>
            </div>
            <span className="text-xs font-mono text-faint hidden sm:inline">
              {craft.steps.length} STEPS ·{' '}
              {color.provenance === 'verified' ? 'AUTHENTIC ARCHIVE' : 'INFERRED TEMPLATE'}
            </span>
          </div>

          {color.provenance === 'inferred' && (
            <div
              className="p-4 rounded-xl surface-subtle text-xs text-muted leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              style={{ borderLeft: `2px solid ${color.hex}` }}
            >
              <span>
                <strong className="text-main font-medium">二级可信度 · 工艺推演：</strong>
                {color.customCraftNote ||
                  '此色归属明确的传统矿物/植物/瓷釉体系，以下配方依据同系古法推演，欢迎社区补充确证古籍出处。'}
              </span>
            </div>
          )}

          {/* 分栏：核心原料与产地 + 媒染与胶结介质配比 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-medium tracking-widest uppercase text-faint">
                核心原料与产地
              </h3>
              <div className="space-y-3">
                {craft.materials && craft.materials.length > 0
                  ? craft.materials.map((m, idx) => (
                      <div key={idx} className="p-4 rounded-xl surface-subtle space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <span className="font-serif text-sm font-semibold text-main">
                            {m.name}
                          </span>
                          {m.origin && <span className="text-[11px] text-faint">{m.origin}</span>}
                        </div>
                        {m.description && (
                          <p className="text-xs text-muted leading-relaxed">{m.description}</p>
                        )}
                      </div>
                    ))
                  : craft.rawMaterials.map((mat, idx) => (
                      <div key={idx} className="p-4 rounded-xl surface-subtle space-y-1">
                        <span className="font-serif text-sm font-semibold text-main">{mat}</span>
                        {craft.origin && (
                          <p className="text-xs text-faint">产地：{craft.origin}</p>
                        )}
                      </div>
                    ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-medium tracking-widest uppercase text-faint">
                媒染与胶结介质配比
              </h3>
              <div className="space-y-3">
                {craft.mordants && craft.mordants.length > 0 ? (
                  craft.mordants.map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl surface-subtle space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-main">{m.name}</span>
                        <span className="font-mono tabular-nums text-muted">约 {m.ratio}%</span>
                      </div>
                      <div
                        className="w-full h-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--border-hairline)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.ratio}%`,
                            backgroundColor: color.hex,
                            opacity: 0.82,
                          }}
                        />
                      </div>
                      {m.note && <p className="text-[11px] text-muted">{m.note}</p>}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl surface-subtle space-y-2">
                    <div className="text-xs font-medium text-main">
                      {craft.mordantOrBinder || '传统天然媒染 / 胶结介质'}
                    </div>
                    {craft.chemistryNote && (
                      <p className="text-xs text-muted leading-relaxed">{craft.chemistryNote}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 古法制色流程 */}
          <div className="space-y-4 pt-2 hairline-t">
            <h3 className="text-xs font-medium tracking-widest uppercase text-faint pt-2">
              古法制色流程
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {craft.steps.map((s) => (
                <div key={s.order} className="p-4 rounded-xl hairline-all flex items-start gap-3.5">
                  <span className="font-mono text-xs font-semibold tabular-nums text-faint pt-0.5 shrink-0">
                    {String(s.order).padStart(2, '0')}
                  </span>
                  <div className="space-y-1">
                    <div className="font-serif text-sm font-semibold text-main">{s.title}</div>
                    <p className="text-xs text-muted leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 历史典籍考据 */}
          {color.references.length > 0 && (
            <div className="pt-2 space-y-3">
              {color.references.map((ref, idx) => (
                <blockquote
                  key={idx}
                  className="pl-5 py-2 space-y-2"
                  style={{ borderLeft: `2px solid ${color.hex}` }}
                >
                  <p className="font-serif text-sm sm:text-[15px] text-main leading-loose">
                    “{ref.quote}”
                  </p>
                  <footer className="text-xs font-serif text-faint tracking-wider">
                    —— {ref.dynasty ? `${ref.dynasty} · ` : ''}
                    {ref.source}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-4 fade-in">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-faint">
                LITERARY COLOR · OPEN FOR RESEARCH
              </div>
              <h2 className="font-serif text-lg font-semibold text-main mt-0.5">
                文献意象色 · 工艺考据待认领
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono surface-subtle text-muted">
              LEVEL 3 · LITERARY
            </span>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            此色收录自中国传统 526 色谱，色名源于诗词意象、自然物候或器物雅称，目前暂无确证古籍配方。为秉持严谨考据原则，本项目不编造虚假配方，欢迎在{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded surface-subtle text-main">
              data/colors.json
            </code>{' '}
            提交典籍引证与古法工艺 PR（详见仓库 <code className="font-mono text-xs">CONTRIBUTING.md</code>）。
          </p>
        </section>
      )}
    </div>
  );
}
