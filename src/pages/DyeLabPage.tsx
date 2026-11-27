import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  COLORS,
  LAB_BASES,
  LAB_MORDANTS,
  LAB_OVERS,
  LAB_PRESETS,
  computeLabMix,
} from '../data/catalog';
import { useGallery } from '../context/GalleryContext';
import {
  describeDeltaE,
  findNearestColors,
  hexToRgb,
  isLightHex,
  rgbToCmyk,
} from '../utils/color';

export function DyeLabPage() {
  const { setAmbientHex, copyText, showToast } = useGallery();
  const [base, setBase] = useState('indigo');
  const [over, setOver] = useState('gardenia');
  const [mordant, setMordant] = useState('alum');

  const mix = useMemo(() => computeLabMix(base, over, mordant), [base, over, mordant]);
  const nearestList = useMemo(() => findNearestColors(mix.hex, COLORS, 3), [mix.hex]);
  const rgb = useMemo(() => hexToRgb(mix.hex), [mix.hex]);
  const cmyk = useMemo(() => rgbToCmyk(rgb.r, rgb.g, rgb.b), [rgb]);
  const light = isLightHex(mix.hex);

  const baseObj = LAB_BASES.find((d) => d.id === base) ?? LAB_BASES[0];
  const overObj = LAB_OVERS.find((d) => d.id === over) ?? LAB_OVERS[0];
  const mordantObj = LAB_MORDANTS.find((m) => m.id === mordant) ?? LAB_MORDANTS[0];

  useEffect(() => {
    setAmbientHex(mix.hex);
    document.title = `古法合色实验室 · 中国传统色谱`;
  }, [mix.hex, setAmbientHex]);

  const applyPreset = (preset: (typeof LAB_PRESETS)[number]) => {
    setBase(preset.base);
    setOver(preset.over);
    setMordant(preset.mordant);
    showToast(`已载入典籍配方：${preset.label}`);
  };

  return (
    <main className="space-y-8">
      {/* 实验室页头 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 hairline-b">
        <div className="space-y-2 max-w-2xl">
          <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-faint">
            ANCIENT COMPOUND DYEING LABORATORY · CIELAB ΔE₀₀
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-wide text-main">
            古法套染与媒染实验室
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            中国传统草木染讲究“套染成间色，媒染定正色”。自由组合基础染材、叠加套染材与古法媒染剂，实时计算 CIELAB ΔE₀₀ 色差并匹配最接近的传统色谱。
          </p>
        </div>

        {/* 经典古法配方预设 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-faint mr-1">典籍预设：</span>
          {LAB_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 rounded-full text-xs text-muted hover:text-main surface-card transition cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* 左侧：三步配料控制台 */}
        <div className="lg:col-span-7 space-y-5">
          {/* 01 基础染材 */}
          <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs font-mono text-faint">01</span>
                <h2 className="font-serif text-base font-semibold text-main">基础染材（底色）</h2>
              </div>
              <span className="text-xs text-faint">主色素基底</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LAB_BASES.map((d) => {
                const active = base === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setBase(d.id)}
                    className="p-3 rounded-xl text-left transition-all cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1.5px solid var(--text-primary)',
                          }
                        : {
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-hairline)',
                          }
                    }
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: d.hex,
                          border: '1px solid rgba(128,128,128,0.2)',
                        }}
                      />
                      <span className="font-serif text-xs sm:text-[13px] font-semibold text-main truncate">
                        {d.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-faint truncate">{d.note}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 02 叠加套染材 */}
          <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs font-mono text-faint">02</span>
                <h2 className="font-serif text-base font-semibold text-main">
                  叠加套染材（可选）
                </h2>
              </div>
              <span className="text-xs text-faint">减色叠染生成间色</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LAB_OVERS.map((d) => {
                const active = over === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setOver(d.id)}
                    className="p-3 rounded-xl text-left transition-all cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1.5px solid var(--text-primary)',
                          }
                        : {
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-hairline)',
                          }
                    }
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: d.hex,
                          border: '1px solid rgba(128,128,128,0.2)',
                        }}
                      />
                      <span className="font-serif text-xs sm:text-[13px] font-semibold text-main truncate">
                        {d.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-faint truncate">{d.note}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 03 媒染剂 */}
          <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs font-mono text-faint">03</span>
                <h2 className="font-serif text-base font-semibold text-main">
                  古法媒染剂（发色与固色）
                </h2>
              </div>
              <span className="text-xs text-faint">酸碱调控与金属络合</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {LAB_MORDANTS.map((m) => {
                const active = mordant === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMordant(m.id)}
                    className="p-3.5 rounded-xl text-left transition-all space-y-1 cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1.5px solid var(--text-primary)',
                          }
                        : {
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-hairline)',
                          }
                    }
                  >
                    <div className="font-serif text-xs sm:text-[13px] font-semibold text-main">
                      {m.name}
                    </div>
                    <div className="text-[10px] font-mono text-faint">{m.tag}</div>
                    <p className="text-[11px] text-muted leading-snug pt-0.5">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：美术馆色标结果展台 */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto overscroll-contain thin-scroll rounded-2xl">
          <div className="surface-card rounded-2xl overflow-hidden">
            {/* 纯净美术馆色标展示区 */}
            <div
              className="h-64 sm:h-72 p-6 sm:p-7 flex flex-col justify-between transition-colors duration-500"
              style={{
                backgroundColor: mix.hex,
                color: light ? '#1A1918' : '#F8F7F4',
              }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest opacity-80">
                <span className="inline-flex items-center gap-1.5">
                  {mix.isHistoricalRecipe && <Sparkles className="w-3.5 h-3.5" />}
                  <span>{mix.isHistoricalRecipe ? 'HISTORICAL RECIPE' : 'LAB SPECIMEN'}</span>
                </span>
                <span className="tabular-nums">{mix.hex}</span>
              </div>

              <div className="space-y-2">
                <div className="text-xs opacity-75">合成色相</div>
                <div className="font-serif text-3xl sm:text-4xl font-semibold tracking-wide">
                  {mix.name}
                </div>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => copyText(mix.hex, '合成色 HEX', mix.hex)}
                    className="px-2.5 py-1 rounded-md backdrop-blur-sm transition cursor-pointer"
                    style={{
                      backgroundColor: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)',
                    }}
                  >
                    HEX {mix.hex}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, '合成色 RGB', mix.hex)
                    }
                    className="px-2.5 py-1 rounded-md backdrop-blur-sm transition cursor-pointer"
                    style={{
                      backgroundColor: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)',
                    }}
                  >
                    RGB {rgb.r}, {rgb.g}, {rgb.b}
                  </button>
                </div>
              </div>
            </div>

            {/* 配方、CIELAB Delta-E 匹配与显色原理解析 */}
            <div className="p-6 space-y-5">
              {/* 配方流程 */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-faint">
                  配方组合
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-1 rounded-lg surface-subtle text-main font-medium">
                    {baseObj.name}
                  </span>
                  {over !== 'none' && (
                    <>
                      <span className="text-faint">+</span>
                      <span className="px-2.5 py-1 rounded-lg surface-subtle text-main font-medium">
                        {overObj.name}
                      </span>
                    </>
                  )}
                  <span className="text-faint">→</span>
                  <span className="px-2.5 py-1 rounded-lg surface-subtle text-main">
                    {mordantObj.name}
                  </span>
                </div>
              </div>

              {/* CIELAB Delta-E 2000 最接近传统色对照 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-faint">
                    CIELAB ΔE₀₀ 最接近传统色谱
                  </span>
                  <span className="text-[10px] font-mono text-faint">TOP 3</span>
                </div>

                <div className="space-y-2">
                  {nearestList.map(({ color: matched, deltaE }, idx) => (
                    <div
                      key={matched.id}
                      className="p-3 rounded-xl surface-subtle flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-8 h-8 rounded-lg shrink-0"
                          style={{
                            backgroundColor: matched.hex,
                            border: '1px solid rgba(128,128,128,0.2)',
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif text-sm font-semibold text-main truncate">
                              {matched.name}
                            </span>
                            <span className="font-mono text-[11px] text-faint tabular-nums">
                              {matched.hex}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-muted tabular-nums">
                            ΔE₀₀ = {deltaE.toFixed(2)} · {describeDeltaE(deltaE)}
                            {idx === 0 ? '（最佳匹配）' : ''}
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/color/${matched.id}`}
                        className="px-2.5 py-1 rounded-full text-xs text-muted hover:text-main hairline-all shrink-0 inline-flex items-center gap-1 transition"
                      >
                        <span>工艺</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* 显色原理 */}
              <div className="space-y-1.5 pt-2 hairline-t">
                <div className="text-[11px] font-mono uppercase tracking-wider text-faint pt-1">
                  显色化学与物理原理
                </div>
                <p className="text-xs sm:text-[13px] text-muted leading-relaxed">{mix.theory}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-faint pt-3 hairline-t tabular-nums">
                <span>
                  CMYK {cmyk.c}, {cmyk.m}, {cmyk.y}, {cmyk.k}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(`--color-custom-dye: ${mix.hex};`, 'CSS 变量', mix.hex)
                  }
                  className="text-muted hover:text-main font-sans transition cursor-pointer"
                >
                  复制 CSS 变量
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
