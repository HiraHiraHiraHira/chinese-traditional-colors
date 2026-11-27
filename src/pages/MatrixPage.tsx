import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpDown, Bookmark, Download, Search, X } from 'lucide-react';
import type { TraditionalColor } from '../../data/schema';
import {
  COLORS,
  CRAFT_FILTER_OPTIONS,
  FAMILY_LABELS,
  FAMILY_OPTIONS,
  PROVENANCE_COUNTS,
  PROVENANCE_FILTER_OPTIONS,
  PROVENANCE_META,
  getColorCraftLabel,
  getCraftById,
  type CraftFilter,
  type MatrixSortMode,
  type ProvenanceFilter,
} from '../data/catalog';
import { useGallery } from '../context/GalleryContext';
import { isLightHex, rgbToHsl } from '../utils/color';

const FAMILY_ORDER: Array<TraditionalColor['family']> = [
  'red',
  'yellow',
  'green',
  'blue',
  'purple',
  'neutral',
];

const CHUNK_SIZE = 25;

interface FamilyGroupSectionProps {
  familyKey: TraditionalColor['family'];
  items: TraditionalColor[];
  onInspectInGallery: (color: TraditionalColor) => void;
}

function FamilyGroupSection({
  familyKey,
  items,
  onInspectInGallery,
}: FamilyGroupSectionProps) {
  const { isFavorite, toggleFavorite, copyText } = useGallery();
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [items]);

  useEffect(() => {
    if (visibleCount >= items.length) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(items.length, prev + CHUNK_SIZE));
        }
      },
      { rootMargin: '280px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, items.length]);

  const displayed = items.slice(0, visibleCount);

  return (
    <section className="space-y-4 fade-in">
      <div className="flex items-baseline justify-between pb-2 hairline-b">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: items[0].hex }}
          />
          <h2 className="font-serif text-lg font-semibold text-main tracking-wide">
            {FAMILY_LABELS[familyKey]}系
          </h2>
        </div>
        <span className="text-xs font-mono tabular-nums text-faint">
          {items.length} SPECIMENS
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
        {displayed.map((c) => {
          const light = isLightHex(c.hex);
          const fav = isFavorite(c.id);
          const craft = getCraftById(c.craftId);
          const subtitle = craft?.rawMaterials[0] ?? PROVENANCE_META[c.provenance].label;
          return (
            <article
              key={c.id}
              className="group surface-card rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1"
            >
              {/* 纯净色块区 */}
              <div
                onClick={() => onInspectInGallery(c)}
                className="h-28 sm:h-40 p-3 sm:p-3.5 flex flex-col justify-between cursor-pointer relative"
                style={{
                  backgroundColor: c.hex,
                  color: light ? '#1A1918' : '#F8F7F4',
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-mono opacity-75">
                  <span>{String(c.index).padStart(3, '0')}</span>
                  <span className="truncate ml-1">{PROVENANCE_META[c.provenance].label}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="hidden sm:inline text-[11px] font-medium opacity-0 group-hover:opacity-95 transition-opacity">
                    鉴赏工艺 →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(c.id, c.name, c.hex);
                    }}
                    className={`ml-auto p-1.5 rounded-full backdrop-blur-sm transition cursor-pointer ${
                      fav ? 'opacity-100' : 'opacity-80 sm:opacity-0 sm:group-hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.16)',
                    }}
                    title={fav ? '移出收藏夹' : '收藏此色'}
                    aria-label={fav ? '移出收藏夹' : '收藏此色'}
                  >
                    <Bookmark className="w-3.5 h-3.5" fill={fav ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* 卡片信息区 */}
              <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-2">
                <Link to={`/color/${c.id}`} className="block">
                  <div className="flex items-baseline justify-between gap-1">
                    <h3 className="font-serif text-sm font-semibold text-main group-hover:underline underline-offset-4 truncate">
                      {c.name}
                    </h3>
                    <span className="text-[11px] text-faint truncate">{c.pinyin}</span>
                  </div>
                  <p className="text-[11px] text-muted truncate mt-0.5">{subtitle}</p>
                </Link>

                <div className="flex items-center justify-between pt-2 hairline-t">
                  <button
                    type="button"
                    onClick={() => copyText(c.hex, `${c.name} HEX`, c.hex)}
                    className="font-mono text-xs tabular-nums text-muted hover:text-main transition inline-flex items-center gap-1 cursor-pointer"
                    title="点击复制 HEX"
                  >
                    <span>{c.hex}</span>
                  </button>
                  <Link
                    to={`/color/${c.id}`}
                    className="text-[11px] text-faint hover:text-main transition"
                  >
                    档案 →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibleCount < items.length && (
        <div ref={sentinelRef} className="py-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(items.length, prev + CHUNK_SIZE * 2))}
            className="px-4 py-1.5 rounded-full text-xs font-mono text-muted hover:text-main surface-card transition cursor-pointer"
          >
            加载更多（已显示 {visibleCount} / {items.length}）
          </button>
        </div>
      )}
    </section>
  );
}

export function MatrixPage() {
  const {
    search,
    setSearch,
    family,
    setFamily,
    craft,
    setCraft,
    provenance,
    setProvenance,
    favorites,
    setSelectedColorId,
    setAmbientHex,
    setDrawerOpen,
  } = useGallery();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortMode, setSortMode] = useState<MatrixSortMode>('index');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `色谱矩阵 (${COLORS.length} 色) · 中国传统色谱`;
  }, []);

  const filteredColors = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = COLORS.filter((c) => {
      if (onlyFavorites && !favorites.includes(c.id)) return false;
      if (family !== 'all' && c.family !== family) return false;
      if (provenance !== 'all' && c.provenance !== provenance) return false;
      const craftProfile = getCraftById(c.craftId);
      if (craft !== 'all' && craftProfile?.category !== craft) return false;
      if (!q) return true;
      const rawMaterials = craftProfile?.rawMaterials.join(' ').toLowerCase() ?? '';
      return (
        c.name.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        (c.englishName?.toLowerCase().includes(q) ?? false) ||
        c.hex.toLowerCase().includes(q) ||
        getColorCraftLabel(c).toLowerCase().includes(q) ||
        FAMILY_LABELS[c.family].includes(q) ||
        rawMaterials.includes(q)
      );
    });

    if (sortMode === 'index') return list;

    return [...list].sort((a, b) => {
      const ha = rgbToHsl(a.rgb[0], a.rgb[1], a.rgb[2]);
      const hb = rgbToHsl(b.rgb[0], b.rgb[1], b.rgb[2]);
      if (sortMode === 'hue') {
        if (Math.abs(ha.h - hb.h) > 1) return ha.h - hb.h;
        return hb.l - ha.l;
      }
      return hb.l - ha.l;
    });
  }, [search, family, craft, provenance, onlyFavorites, favorites, sortMode]);

  const groups = useMemo(
    () =>
      FAMILY_ORDER.map((f) => ({
        family: f,
        items: filteredColors.filter((c) => c.family === f),
      })).filter((g) => g.items.length > 0),
    [filteredColors],
  );

  const handleInspectInGallery = (color: TraditionalColor) => {
    setSelectedColorId(color.id);
    setAmbientHex(color.hex);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="space-y-8">
      {/* 矩阵页头与筛选条 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 hairline-b">
        <div className="space-y-2 max-w-2xl">
          <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-faint">
            CHINESE CHROMATIC ARCHIVE · {PROVENANCE_COUNTS.total} SPECIMENS ({PROVENANCE_COUNTS.verified}{' '}
            VERIFIED · {PROVENANCE_COUNTS.inferred} INFERRED · {PROVENANCE_COUNTS.literary} LITERARY)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-wide text-main">
            中国传统色谱矩阵
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            完整收录 526 传统色谱及 36 补录典籍正色（共 {COLORS.length} 色），严格实行三级可信度标注与分组懒加载。点击色值复制 HEX，点击「档案」直达单色 WCAG 对比度与高清海报导出。
          </p>
        </div>

        {/* 矩阵搜索、工艺与排序（移动端规整两列网格） */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
          <div className="relative col-span-2 sm:w-52">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索色名、原料、HEX..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-[13px] text-main placeholder:text-faint surface-card focus:outline-none"
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

          <select
            value={craft}
            onChange={(e) => setCraft(e.target.value as CraftFilter)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs sm:text-[13px] text-main surface-card focus:outline-none cursor-pointer"
            aria-label="按工艺筛选"
          >
            {CRAFT_FILTER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} style={{ backgroundColor: 'var(--bg-surface)' }}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-[13px] text-main surface-card">
            <ArrowUpDown className="w-3.5 h-3.5 text-faint shrink-0" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as MatrixSortMode)}
              className="bg-transparent focus:outline-none cursor-pointer w-full sm:w-auto"
              aria-label="排序方式"
            >
              <option value="index" style={{ backgroundColor: 'var(--bg-surface)' }}>
                按档案编号
              </option>
              <option value="hue" style={{ backgroundColor: 'var(--bg-surface)' }}>
                按色相顺排
              </option>
              <option value="lightness" style={{ backgroundColor: 'var(--bg-surface)' }}>
                按明度浅→深
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-main surface-card hover:border-current/25 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 Tokens</span>
          </button>
        </div>
      </div>

      {/* 色系 + 可信度筛选药丸 */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
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

            <span
              className="hidden md:inline-block h-4 w-px mx-1"
              style={{ backgroundColor: 'var(--border-strong)' }}
            />

            {PROVENANCE_FILTER_OPTIONS.map((opt) => {
              const active = provenance === opt.id;
              const count =
                opt.id === 'all'
                  ? PROVENANCE_COUNTS.total
                  : PROVENANCE_COUNTS[opt.id as Exclude<ProvenanceFilter, 'all'>];
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProvenance(opt.id)}
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
                  {opt.label}
                  <span className="ml-1 opacity-70 font-mono text-[10px]">{count}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setOnlyFavorites((prev) => !prev)}
              className={`ml-1 px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1 transition cursor-pointer ${
                onlyFavorites ? 'font-medium' : 'text-muted hover:text-main'
              }`}
              style={
                onlyFavorites
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
              <Bookmark className="w-3 h-3" fill={onlyFavorites ? 'currentColor' : 'none'} />
              <span>仅看收藏 ({favorites.length})</span>
            </button>
          </div>

          <span className="text-xs font-mono tabular-nums text-faint">
            共展示 {filteredColors.length} 种传统色
          </span>
        </div>
      </div>

      {/* 宽敞现代色卡网格 */}
      {groups.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="text-sm text-faint">未找到匹配的传统色彩，请调整筛选条件。</div>
          {(search || family !== 'all' || craft !== 'all' || provenance !== 'all' || onlyFavorites) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFamily('all');
                setCraft('all');
                setProvenance('all');
                setOnlyFavorites(false);
              }}
              className="px-4 py-2 rounded-full text-xs surface-card text-main cursor-pointer"
            >
              重置筛选条件
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((g) => (
            <FamilyGroupSection
              key={g.family}
              familyKey={g.family}
              items={g.items}
              onInspectInGallery={handleInspectInGallery}
            />
          ))}
        </div>
      )}
    </main>
  );
}
