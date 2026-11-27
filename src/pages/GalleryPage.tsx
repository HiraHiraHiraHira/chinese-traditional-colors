import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Bookmark, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  COLORS,
  CRAFT_FILTER_OPTIONS,
  FAMILY_LABELS,
  FAMILY_OPTIONS,
  PROVENANCE_FILTER_OPTIONS,
  PROVENANCE_META,
  getColorById,
  getColorCraftLabel,
  getCraftById,
  type CraftFilter,
  type ProvenanceFilter,
} from '../data/catalog';
import { useGallery } from '../context/GalleryContext';
import { isLightHex } from '../utils/color';
import { CraftAnalysisSection } from '../components/CraftAnalysisSection';

const SIDEBAR_PAGE_SIZE = 80;

export function GalleryPage() {
  const {
    selectedColorId,
    setSelectedColorId,
    setAmbientHex,
    search,
    setSearch,
    family,
    setFamily,
    craft,
    setCraft,
    provenance,
    setProvenance,
    isFavorite,
    toggleFavorite,
    copyText,
  } = useGallery();

  const [visibleLimit, setVisibleLimit] = useState(SIDEBAR_PAGE_SIZE);
  const [mobileIndexOpen, setMobileIndexOpen] = useState(false);

  const currentColor = useMemo(
    () => getColorById(selectedColorId) ?? COLORS[0],
    [selectedColorId],
  );
  const currentCraft = useMemo(() => getCraftById(currentColor.craftId), [currentColor.craftId]);

  useEffect(() => {
    setAmbientHex(currentColor.hex);
    document.title = `${currentColor.name} (${currentColor.hex}) · 中国传统色谱`;
  }, [currentColor.hex, currentColor.name, setAmbientHex]);

  useEffect(() => {
    setVisibleLimit(SIDEBAR_PAGE_SIZE);
  }, [search, family, craft, provenance]);

  const filteredColors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return COLORS.filter((c) => {
      if (family !== 'all' && c.family !== family) return false;
      if (provenance !== 'all' && c.provenance !== provenance) return false;
      const craftProfile = getCraftById(c.craftId);
      if (craft !== 'all' && craftProfile?.category !== craft) return false;
      if (!q) return true;
      const rawMaterials = craftProfile?.rawMaterials.join(' ').toLowerCase() ?? '';
      const craftLabel = getColorCraftLabel(c).toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        (c.englishName?.toLowerCase().includes(q) ?? false) ||
        c.hex.toLowerCase().includes(q) ||
        craftLabel.includes(q) ||
        FAMILY_LABELS[c.family].includes(q) ||
        rawMaterials.includes(q)
      );
    });
  }, [search, family, craft, provenance]);

  const displayedColors = useMemo(
    () => filteredColors.slice(0, visibleLimit),
    [filteredColors, visibleLimit],
  );

  const lightSwatch = isLightHex(currentColor.hex);
  const fav = isFavorite(currentColor.id);
  const craftLabel = getColorCraftLabel(currentColor);
  const provenanceMeta = PROVENANCE_META[currentColor.provenance];
  const cssVar = `--color-${currentColor.id}: ${currentColor.hex};`;

  const handleSelectColor = (id: string) => {
    setSelectedColorId(id);
    setMobileIndexOpen(false);
    if (window.scrollY > 120) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const quickStripColors = useMemo(() => filteredColors.slice(0, 24), [filteredColors]);

  return (
    <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
      {/* 移动端 / 平板端（< lg）：紧凑速览色带 + 可折叠完整检索面板，首屏即见主色展台 */}
      <div className="lg:hidden surface-card rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              type="text"
              value={search}
              onFocus={() => setMobileIndexOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setMobileIndexOpen(true);
              }}
              placeholder="搜索 562 种传统色、拼音或原料..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs text-main placeholder:text-faint surface-subtle focus:outline-none focus:ring-1 focus:ring-current/25 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-main cursor-pointer"
                aria-label="清空搜索"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileIndexOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-main surface-subtle shrink-0 cursor-pointer"
            aria-expanded={mobileIndexOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted" />
            <span>索引</span>
            <span className="font-mono text-[10px] text-faint tabular-nums">
              {filteredColors.length}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted transition-transform ${
                mobileIndexOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* 移动端横向快选色带 */}
        {!mobileIndexOpen && quickStripColors.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto thin-scroll pb-1 -mx-0.5 px-0.5">
            {quickStripColors.map((c) => {
              const active = c.id === currentColor.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectColor(c.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs shrink-0 transition cursor-pointer"
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--text-primary)',
                          color: 'var(--bg-surface)',
                        }
                      : {
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-hairline)',
                          color: 'var(--text-primary)',
                        }
                  }
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: c.hex,
                      border: '1px solid rgba(128,128,128,0.28)',
                    }}
                  />
                  <span className="font-serif font-medium whitespace-nowrap">{c.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 移动端展开的完整筛选 + 索引列表 */}
        {mobileIndexOpen && (
          <div className="space-y-3 pt-1 hairline-t">
            <div className="flex flex-wrap gap-1.5 pt-2">
              {FAMILY_OPTIONS.map((opt) => {
                const active = family === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFamily(opt.id)}
                    className={`px-2.5 py-1 rounded-full text-xs transition cursor-pointer ${
                      active ? 'font-medium' : 'text-muted hover:text-main'
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--text-primary)',
                            color: 'var(--bg-surface)',
                          }
                        : {
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-hairline)',
                          }
                    }
                  >
                    {opt.shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={provenance}
                onChange={(e) => setProvenance(e.target.value as ProvenanceFilter)}
                className="px-2.5 py-1.5 rounded-xl text-xs text-main surface-subtle focus:outline-none cursor-pointer"
                aria-label="移动端按可信度筛选"
              >
                {PROVENANCE_FILTER_OPTIONS.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={craft}
                onChange={(e) => setCraft(e.target.value as CraftFilter)}
                className="px-2.5 py-1.5 rounded-xl text-xs text-main surface-subtle focus:outline-none cursor-pointer"
                aria-label="移动端按工艺筛选"
              >
                {CRAFT_FILTER_OPTIONS.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 max-h-[42vh] overflow-y-auto overscroll-contain thin-scroll pr-1">
              {filteredColors.length === 0 ? (
                <div className="py-8 text-center text-xs text-faint">未找到匹配的传统色彩</div>
              ) : (
                <>
                  {displayedColors.map((c) => {
                    const active = c.id === currentColor.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectColor(c.id)}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition cursor-pointer"
                        style={
                          active
                            ? {
                                backgroundColor: 'var(--bg-subtle)',
                                border: '1px solid var(--border-strong)',
                              }
                            : { border: '1px solid transparent' }
                        }
                      >
                        <span
                          className="w-7 h-7 rounded-lg shrink-0 shadow-inner"
                          style={{
                            backgroundColor: c.hex,
                            border: '1px solid rgba(128,128,128,0.18)',
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-serif text-sm font-semibold text-main truncate">
                              {c.name}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-faint">
                              {c.hex}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-faint mt-0.5">
                            <span className="truncate">{c.pinyin}</span>
                            <span className="shrink-0 ml-2">
                              {PROVENANCE_META[c.provenance].label}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {visibleLimit < filteredColors.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + SIDEBAR_PAGE_SIZE)}
                      className="w-full py-2 mt-1 rounded-xl text-[11px] font-mono text-muted surface-subtle cursor-pointer"
                    >
                      展开更多色卡（已显示 {displayedColors.length} / {filteredColors.length}）
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 桌面端左侧（lg+）：视口锁定高度的色彩索引栏，内部独立滚动且阻止滚动穿透 */}
      <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 lg:h-[calc(100vh-7.5rem)] surface-card rounded-2xl p-4 flex-col gap-3 min-h-0">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索色名、拼音、HEX 或原料..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-[13px] text-main placeholder:text-faint surface-subtle focus:outline-none focus:ring-1 focus:ring-current/25 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-main cursor-pointer"
              aria-label="清空搜索"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 色系筛选 */}
        <div className="flex flex-wrap gap-1.5">
          {FAMILY_OPTIONS.map((opt) => {
            const active = family === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFamily(opt.id)}
                className={`px-2.5 py-1 rounded-full text-xs transition cursor-pointer ${
                  active ? 'font-medium' : 'text-muted hover:text-main'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--text-primary)',
                        color: 'var(--bg-surface)',
                      }
                    : {
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-hairline)',
                      }
                }
              >
                {opt.shortLabel}
              </button>
            );
          })}
        </div>

        {/* 工艺 + 可信度筛选与计数 */}
        <div className="flex items-center justify-between gap-2 pt-2 hairline-t">
          <div className="flex items-center gap-2 min-w-0">
            <select
              value={provenance}
              onChange={(e) => setProvenance(e.target.value as ProvenanceFilter)}
              className="text-xs text-muted bg-transparent py-1 focus:outline-none cursor-pointer"
              aria-label="按可信度筛选"
            >
              {PROVENANCE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} style={{ backgroundColor: 'var(--bg-surface)' }}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={craft}
              onChange={(e) => setCraft(e.target.value as CraftFilter)}
              className="text-xs text-muted bg-transparent py-1 focus:outline-none cursor-pointer truncate max-w-[110px]"
              aria-label="按工艺筛选"
            >
              {CRAFT_FILTER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} style={{ backgroundColor: 'var(--bg-surface)' }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-faint shrink-0">
            {filteredColors.length} / {COLORS.length}
          </span>
        </div>

        {/* 色彩索引列表 */}
        <div className="space-y-1 max-h-[34vh] lg:max-h-none lg:flex-1 min-h-0 overflow-y-auto overscroll-contain thin-scroll pr-1">
          {filteredColors.length === 0 ? (
            <div className="py-10 text-center text-xs text-faint">未找到匹配的传统色彩</div>
          ) : (
            <>
              {displayedColors.map((c) => {
                const active = c.id === currentColor.id;
                const itemFav = isFavorite(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectColor(c.id)}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-strong)',
                          }
                        : {
                            border: '1px solid transparent',
                          }
                    }
                  >
                    <span
                      className="w-7 h-7 rounded-lg shrink-0 shadow-inner"
                      style={{
                        backgroundColor: c.hex,
                        border: '1px solid rgba(128,128,128,0.18)',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-serif text-sm font-semibold text-main truncate flex items-center gap-1">
                          {c.name}
                          {itemFav && (
                            <Bookmark
                              className="w-2.5 h-2.5 text-muted shrink-0"
                              fill="currentColor"
                            />
                          )}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-faint">
                          {c.hex}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-faint mt-0.5">
                        <span className="truncate">{c.pinyin}</span>
                        <span className="shrink-0 ml-2">{PROVENANCE_META[c.provenance].label}</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {visibleLimit < filteredColors.length && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + SIDEBAR_PAGE_SIZE)}
                  className="w-full py-2 mt-1 rounded-xl text-[11px] font-mono text-muted hover:text-main surface-subtle transition cursor-pointer"
                >
                  展开更多色卡（已显示 {displayedColors.length} / {filteredColors.length}）
                </button>
              )}
            </>
          )}
        </div>
      </aside>

      {/* 右侧：宽敞大气的策展级详情展台 */}
      <section className="lg:col-span-8 xl:col-span-9 space-y-6">
        {/* 1. 雕塑感主色展台 */}
        <article key={currentColor.id} className="surface-card rounded-2xl overflow-hidden fade-in">
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* 左侧纯净大色标展台 */}
            <div
              className="md:col-span-5 min-h-[240px] md:min-h-[340px] p-6 flex flex-col justify-between relative"
              style={{
                backgroundColor: currentColor.hex,
                color: lightSwatch ? '#1A1918' : '#F8F7F4',
              }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase opacity-80">
                <span>NO. {String(currentColor.index).padStart(3, '0')}</span>
                <span>{FAMILY_LABELS[currentColor.family]}系</span>
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs opacity-75 tracking-wider">{craftLabel}</div>
                  <div className="font-mono text-lg font-medium tracking-wider tabular-nums">
                    {currentColor.hex}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    toggleFavorite(currentColor.id, currentColor.name, currentColor.hex)
                  }
                  className="p-2 rounded-full backdrop-blur-sm transition cursor-pointer"
                  style={{
                    backgroundColor: lightSwatch ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.16)',
                  }}
                  title={fav ? '移出收藏夹' : '收藏此色'}
                  aria-label={fav ? '移出收藏夹' : '收藏此色'}
                >
                  <Bookmark className="w-4 h-4" fill={fav ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* 右侧瑞士网格文字与色值面板 */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-[0.14em] text-faint mb-1.5">
                      {currentColor.englishName ?? currentColor.id}
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-wide text-main">
                        {currentColor.name}
                      </h1>
                      <span className="text-sm font-serif text-muted tracking-widest">
                        {currentColor.pinyin}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] text-muted surface-subtle"
                      title={provenanceMeta.desc}
                    >
                      {provenanceMeta.label}
                    </span>
                    <Link
                      to={`/color/${currentColor.id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-main transition"
                    >
                      <span>独立档案 · WCAG · 海报</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {currentColor.description && (
                  <p className="text-sm text-muted leading-relaxed">{currentColor.description}</p>
                )}
              </div>

              {/* 四个极简一键复制参数格 */}
              <div className="grid grid-cols-2 gap-2.5 pt-4 hairline-t">
                <button
                  type="button"
                  onClick={() => copyText(currentColor.hex, 'HEX', currentColor.hex)}
                  className="group p-3 rounded-xl text-left surface-subtle hover:border-current/25 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-faint">
                    <span>HEX</span>
                    <span className="opacity-0 group-hover:opacity-100 transition text-main">
                      复制
                    </span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-medium text-main tabular-nums mt-1">
                    {currentColor.hex}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyText(`rgb(${currentColor.rgb.join(', ')})`, 'RGB', currentColor.hex)
                  }
                  className="group p-3 rounded-xl text-left surface-subtle hover:border-current/25 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-faint">
                    <span>RGB</span>
                    <span className="opacity-0 group-hover:opacity-100 transition text-main">
                      复制
                    </span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-medium text-main tabular-nums mt-1">
                    {currentColor.rgb.join(', ')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      `cmyk(${currentColor.cmyk.map((v) => `${v}%`).join(', ')})`,
                      'CMYK',
                      currentColor.hex,
                    )
                  }
                  className="group p-3 rounded-xl text-left surface-subtle hover:border-current/25 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-faint">
                    <span>CMYK</span>
                    <span className="opacity-0 group-hover:opacity-100 transition text-main">
                      复制
                    </span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-medium text-main tabular-nums mt-1">
                    {currentColor.cmyk.join(', ')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => copyText(cssVar, 'CSS 变量', currentColor.hex)}
                  className="group p-3 rounded-xl text-left surface-subtle hover:border-current/25 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-faint">
                    <span>CSS VAR</span>
                    <span className="opacity-0 group-hover:opacity-100 transition text-main">
                      复制
                    </span>
                  </div>
                  <div className="font-mono text-xs font-medium text-main truncate mt-1">
                    --color-{currentColor.id}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* 2 & 3. 工艺色阶模拟 + 制色工艺全解析 */}
        <CraftAnalysisSection color={currentColor} craft={currentCraft} />
      </section>
    </main>
  );
}
