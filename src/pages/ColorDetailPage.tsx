import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import {
  COLORS,
  FAMILY_LABELS,
  PROVENANCE_META,
  getColorById,
  getColorCraftLabel,
  getCraftById,
} from '../data/catalog';
import { useGallery } from '../context/GalleryContext';
import {
  describeDeltaE,
  evaluateWcag,
  findNearestColors,
  hexToLab,
  isLightHex,
  rgbToHsl,
} from '../utils/color';
import { CraftAnalysisSection } from '../components/CraftAnalysisSection';

export function ColorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const {
    theme,
    setAmbientHex,
    setSelectedColorId,
    isFavorite,
    toggleFavorite,
    copyText,
    showToast,
  } = useGallery();

  const color = useMemo(() => getColorById(slug), [slug]);
  const craft = useMemo(() => getCraftById(color?.craftId), [color?.craftId]);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [posterLayout, setPosterLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [showPosterQuote, setShowPosterQuote] = useState(true);

  useEffect(() => {
    if (color) {
      setAmbientHex(color.hex);
      setSelectedColorId(color.id);
      document.title = `${color.name} (${color.hex}) · 中国传统色谱`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [color, setAmbientHex, setSelectedColorId]);

  const currentIdx = color ? COLORS.findIndex((c) => c.id === color.id) : -1;
  const prevColor = currentIdx > 0 ? COLORS[currentIdx - 1] : COLORS[COLORS.length - 1];
  const nextColor = currentIdx >= 0 && currentIdx < COLORS.length - 1 ? COLORS[currentIdx + 1] : COLORS[0];

  const nearestColors = useMemo(
    () => (color ? findNearestColors(color.hex, COLORS, 4, color.id) : []),
    [color],
  );

  if (!color) {
    return (
      <main className="py-24 text-center space-y-4">
        <div className="text-xs font-mono uppercase tracking-[0.16em] text-faint">
          404 · SPECIMEN NOT FOUND
        </div>
        <h1 className="font-serif text-2xl font-semibold text-main">未找到该传统色档案</h1>
        <p className="text-sm text-muted">请返回色谱矩阵浏览全部已收录传统色彩。</p>
        <Link
          to="/matrix"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium surface-card text-main"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回色谱矩阵</span>
        </Link>
      </main>
    );
  }

  const lightSwatch = isLightHex(color.hex);
  const fav = isFavorite(color.id);
  const craftLabel = getColorCraftLabel(color);
  const provenance = PROVENANCE_META[color.provenance];
  const lab = hexToLab(color.hex);
  const hsl = rgbToHsl(color.rgb[0], color.rgb[1], color.rgb[2]);
  const cssVar = `--color-${color.id}: ${color.hex};`;

  const wcagWhiteOnColor = evaluateWcag('#FFFFFF', color.hex);
  const wcagDarkOnColor = evaluateWcag('#1A1918', color.hex);
  const wcagColorOnLight = evaluateWcag(color.hex, '#F6F5F0');
  const wcagColorOnDark = evaluateWcag(color.hex, '#131312');

  const handleExportPoster = async () => {
    if (!posterRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const link = document.createElement('a');
      link.download = `chinese-color-${color.id}-${color.hex.slice(1)}.png`;
      link.href = dataUrl;
      link.click();
      showToast(`已导出「${color.name}」高清色卡海报 PNG`, color.hex);
    } catch {
      showToast('导出海报失败，请稍后重试', '#EF4444');
    } finally {
      setExporting(false);
    }
  };

  const handleShareLink = () => {
    copyText(window.location.href, '独立档案链接', color.hex);
  };

  const posterPaperBg = theme === 'dark' ? '#1B1A18' : '#FFFFFF';
  const posterTextPrimary = theme === 'dark' ? '#F2F0EB' : '#1A1918';
  const posterTextSecondary = theme === 'dark' ? '#9D9A93' : '#6B6863';
  const posterBorder = theme === 'dark' ? 'rgba(245,244,240,0.12)' : 'rgba(24,24,22,0.1)';

  return (
    <main className="space-y-8">
      {/* 顶部面包屑与翻页操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link to="/matrix" className="inline-flex items-center gap-1.5 hover:text-main transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>色谱矩阵</span>
          </Link>
          <span className="text-faint">/</span>
          <span>{FAMILY_LABELS[color.family]}系</span>
          <span className="text-faint">/</span>
          <span className="text-main font-medium">{color.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted hover:text-main surface-card transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>复制链接</span>
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(color.id, color.name, color.hex)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted hover:text-main surface-card transition cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" fill={fav ? 'currentColor' : 'none'} />
            <span>{fav ? '已收藏' : '收藏'}</span>
          </button>

          <div className="flex items-center gap-1 ml-1">
            <Link
              to={`/color/${prevColor.id}`}
              className="p-1.5 rounded-full surface-card text-muted hover:text-main transition"
              title={`上一色：${prevColor.name}`}
              aria-label={`上一色：${prevColor.name}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              to={`/color/${nextColor.id}`}
              className="p-1.5 rounded-full surface-card text-muted hover:text-main transition"
              title={`下一色：${nextColor.name}`}
              aria-label={`下一色：${nextColor.name}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 主体两栏：左 8 列色志与 WCAG / 工艺解析，右 4 列竖版高清海报预览与一键导出 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* 主展卡 */}
          <article className="surface-card rounded-2xl overflow-hidden fade-in">
            <div
              className="h-52 sm:h-60 p-6 sm:p-8 flex flex-col justify-between"
              style={{
                backgroundColor: color.hex,
                color: lightSwatch ? '#1A1918' : '#F8F7F4',
              }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase opacity-80">
                <span>ARCHIVE NO. {String(color.index).padStart(2, '0')}</span>
                <span>
                  {FAMILY_LABELS[color.family]}系 · {craftLabel}
                </span>
              </div>

              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.14em] opacity-75 mb-1">
                    {color.englishName ?? color.id}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-wide">
                      {color.name}
                    </h1>
                    <span className="font-serif text-base tracking-widest opacity-85">
                      {color.pinyin}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xl font-medium tabular-nums tracking-wider">
                  {color.hex}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted leading-relaxed max-w-2xl">
                  {color.description}
                </p>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono surface-subtle text-muted shrink-0">
                  {provenance.en} · {provenance.label}
                </span>
              </div>

              {/* 六组精准色值参数 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 hairline-t">
                {[
                  { label: 'HEX', value: color.hex, copy: color.hex },
                  {
                    label: 'RGB',
                    value: color.rgb.join(', '),
                    copy: `rgb(${color.rgb.join(', ')})`,
                  },
                  {
                    label: 'CMYK',
                    value: color.cmyk.join(', '),
                    copy: `cmyk(${color.cmyk.map((v) => `${v}%`).join(', ')})`,
                  },
                  {
                    label: 'HSL',
                    value: `${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`,
                    copy: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
                  },
                  {
                    label: 'CIELAB',
                    value: `${lab.l.toFixed(1)}, ${lab.a.toFixed(1)}, ${lab.b.toFixed(1)}`,
                    copy: `lab(${lab.l.toFixed(1)}% ${lab.a.toFixed(1)} ${lab.b.toFixed(1)})`,
                  },
                  {
                    label: 'CSS VAR',
                    value: `--color-${color.id}`,
                    copy: cssVar,
                  },
                ].map((spec) => (
                  <button
                    key={spec.label}
                    type="button"
                    onClick={() => copyText(spec.copy, spec.label, color.hex)}
                    className="group p-3 rounded-xl text-left surface-subtle hover:border-current/25 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-faint">
                      <span>{spec.label}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition text-main">
                        复制
                      </span>
                    </div>
                    <div className="font-mono text-xs sm:text-[13px] font-medium text-main tabular-nums truncate mt-1">
                      {spec.value}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </article>

          {/* WCAG 2.1 无障碍对比度检测 */}
          <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-5 fade-in">
            <div className="flex items-center justify-between gap-2 pb-4 hairline-b">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-faint">
                  WCAG 2.1 ACCESSIBILITY CONTRAST
                </div>
                <h2 className="font-serif text-lg font-semibold text-main mt-0.5">
                  黑白文本与画廊背景对比度检测
                </h2>
              </div>
              <ShieldCheck className="w-5 h-5 text-faint shrink-0" strokeWidth={1.6} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  title: '纯白字置本色底',
                  fg: '#FFFFFF',
                  bg: color.hex,
                  sample: `${color.name} · 宣纸素墨`,
                  result: wcagWhiteOnColor,
                },
                {
                  title: '深炭字置本色底',
                  fg: '#1A1918',
                  bg: color.hex,
                  sample: `${color.name} · 宣纸素墨`,
                  result: wcagDarkOnColor,
                },
                {
                  title: '本色字置明馆底 (#F6F5F0)',
                  fg: color.hex,
                  bg: '#F6F5F0',
                  sample: `${color.name} · 浅色画廊排版`,
                  result: wcagColorOnLight,
                },
                {
                  title: '本色字置暗馆底 (#131312)',
                  fg: color.hex,
                  bg: '#131312',
                  sample: `${color.name} · 暗黑画廊排版`,
                  result: wcagColorOnDark,
                },
              ].map((item) => {
                const passed = item.result.aaNormal;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl overflow-hidden hairline-all flex flex-col"
                  >
                    <div
                      className="px-4 py-5 flex items-center justify-between gap-3"
                      style={{ backgroundColor: item.bg, color: item.fg }}
                    >
                      <span className="font-serif text-base font-semibold">{item.sample}</span>
                      <span className="font-mono text-sm font-semibold tabular-nums shrink-0">
                        {item.result.ratio.toFixed(2)} : 1
                      </span>
                    </div>
                    <div
                      className="px-4 py-2.5 flex items-center justify-between gap-2 text-[11px]"
                      style={{ backgroundColor: 'var(--bg-subtle)' }}
                    >
                      <span className="text-muted">{item.title}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            backgroundColor: passed
                              ? 'rgba(16, 185, 129, 0.14)'
                              : item.result.aaLarge
                                ? 'rgba(245, 158, 11, 0.16)'
                                : 'rgba(239, 68, 68, 0.14)',
                            color: passed
                              ? '#059669'
                              : item.result.aaLarge
                                ? '#B45309'
                                : '#DC2626',
                          }}
                        >
                          {item.result.grade === 'Fail' ? '未达 AA' : `WCAG ${item.result.grade}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 工艺色阶模拟与完整工艺解析 */}
          <CraftAnalysisSection color={color} craft={craft} />

          {/* CIELAB Delta-E 色相近邻 */}
          <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-5 fade-in">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-faint">
                CIELAB PERCEPTUAL NEIGHBORS (ΔE₀₀)
              </div>
              <h2 className="font-serif text-lg font-semibold text-main mt-0.5">
                相近传统色谱对照
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {nearestColors.map(({ color: neighbor, deltaE }) => (
                <Link
                  key={neighbor.id}
                  to={`/color/${neighbor.id}`}
                  className="group surface-subtle rounded-xl overflow-hidden hover:-translate-y-0.5 transition block"
                >
                  <div className="h-20" style={{ backgroundColor: neighbor.hex }} />
                  <div className="p-3 space-y-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-serif text-sm font-semibold text-main group-hover:underline underline-offset-4">
                        {neighbor.name}
                      </span>
                      <span className="text-[10px] font-mono text-faint tabular-nums">
                        ΔE {deltaE.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                      <span>{neighbor.hex}</span>
                      <span className="font-sans text-[10px] text-faint">
                        {describeDeltaE(deltaE)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* 右侧：典藏色卡海报实时预览 + 一键导出 PNG */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto overscroll-contain thin-scroll space-y-4 pr-0.5">
          <div className="surface-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-faint">
                  EXHIBITION POSTER SPECIMEN
                </div>
                <h2 className="font-serif text-base font-semibold text-main">
                  典藏色卡海报导出
                </h2>
              </div>
              <span className="text-[10px] font-mono text-faint">3x PNG</span>
            </div>

            {/* 海报比例与引文选项 */}
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <div
                className="inline-flex p-0.5 rounded-lg hairline-all"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => setPosterLayout('vertical')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    posterLayout === 'vertical' ? 'text-main font-medium' : 'text-muted'
                  }`}
                  style={
                    posterLayout === 'vertical'
                      ? { backgroundColor: 'var(--bg-surface)' }
                      : undefined
                  }
                >
                  竖版 3:4
                </button>
                <button
                  type="button"
                  onClick={() => setPosterLayout('horizontal')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    posterLayout === 'horizontal' ? 'text-main font-medium' : 'text-muted'
                  }`}
                  style={
                    posterLayout === 'horizontal'
                      ? { backgroundColor: 'var(--bg-surface)' }
                      : undefined
                  }
                >
                  横版色卡
                </button>
              </div>

              <label className="inline-flex items-center gap-1.5 text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPosterQuote}
                  onChange={(e) => setShowPosterQuote(e.target.checked)}
                  className="accent-current cursor-pointer"
                />
                <span>附引文/释义</span>
              </label>
            </div>

            {/* 可导出的美术馆色卡 DOM */}
            <div className="flex justify-center">
              <div
                ref={posterRef}
                className={`w-full rounded-xl overflow-hidden flex ${
                  posterLayout === 'horizontal'
                    ? 'flex-row min-h-[190px] sm:min-h-[210px]'
                    : 'max-w-[340px] flex-col'
                }`}
                style={{
                  backgroundColor: posterPaperBg,
                  border: `1px solid ${posterBorder}`,
                }}
              >
                {/* 纯净色块画幅 */}
                <div
                  className={
                    posterLayout === 'horizontal'
                      ? 'w-[42%] p-3.5 sm:p-5 flex flex-col justify-between shrink-0'
                      : 'h-64 sm:h-72 p-5 sm:p-6 flex flex-col justify-between'
                  }
                  style={{
                    backgroundColor: color.hex,
                    color: lightSwatch ? '#1A1918' : '#F8F7F4',
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.14em] sm:tracking-[0.16em] uppercase opacity-75">
                    <span>{posterLayout === 'horizontal' ? 'CTC' : 'CHINESE CHROMATICS'}</span>
                    <span>NO. {String(color.index).padStart(3, '0')}</span>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[10px] sm:text-[11px] tracking-widest opacity-80">
                        {craftLabel}
                      </div>
                      <div className="font-mono text-xs sm:text-sm font-medium tracking-wider mt-0.5 tabular-nums">
                        {color.hex}
                      </div>
                    </div>
                    {posterLayout === 'vertical' && (
                      <div className="text-[10px] font-mono opacity-75">
                        {FAMILY_LABELS[color.family]}系
                      </div>
                    )}
                  </div>
                </div>

                {/* 瑞士网格美术馆题签 */}
                <div
                  className={
                    posterLayout === 'horizontal'
                      ? 'flex-1 p-3.5 sm:p-5 flex flex-col justify-between gap-2.5 min-w-0'
                      : 'p-5 sm:p-6 space-y-4'
                  }
                >
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div
                        className={`font-serif font-semibold tracking-wide ${
                          posterLayout === 'horizontal' ? 'text-xl sm:text-2xl' : 'text-3xl'
                        }`}
                        style={{ color: posterTextPrimary }}
                      >
                        {color.name}
                      </div>
                      <div
                        className="font-serif text-[11px] sm:text-xs tracking-widest truncate"
                        style={{ color: posterTextSecondary }}
                      >
                        {color.pinyin}
                      </div>
                    </div>

                    {color.englishName && (
                      <div
                        className="text-[10px] font-mono uppercase tracking-[0.16em]"
                        style={{ color: posterTextSecondary }}
                      >
                        {color.englishName}
                      </div>
                    )}
                  </div>

                  {showPosterQuote && (color.references[0] || color.description) && (
                    <p
                      className="font-serif text-[11px] leading-relaxed pt-3"
                      style={{
                        color: posterTextSecondary,
                        borderTop: `1px solid ${posterBorder}`,
                      }}
                    >
                      {color.references[0] ? (
                        <>
                          “{color.references[0].quote}”
                          <span className="block mt-1 opacity-75">
                            —— {color.references[0].source}
                          </span>
                        </>
                      ) : (
                        color.description
                      )}
                    </p>
                  )}

                  <div
                    className="pt-3 flex items-center justify-between text-[10px] font-mono tabular-nums flex-wrap gap-1"
                    style={{
                      color: posterTextSecondary,
                      borderTop: `1px solid ${posterBorder}`,
                    }}
                  >
                    <span>RGB {color.rgb.join(' / ')}</span>
                    <span>CMYK {color.cmyk.join(' / ')}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={exporting}
              onClick={handleExportPoster}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-surface)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {exporting
                  ? '正在生成高清色卡...'
                  : `一键导出${posterLayout === 'vertical' ? '竖版' : '横版'}高清色卡 PNG`}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
