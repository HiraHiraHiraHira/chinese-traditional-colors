import type { ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Moon, RefreshCw, Sun } from 'lucide-react';
import { COLORS, PROVENANCE_COUNTS } from '../data/catalog';
import { useGallery } from '../context/GalleryContext';
import { CollectionDrawer } from './CollectionDrawer';

const NAV_ITEMS = [
  { to: '/', label: '色志 · 鉴赏', end: true },
  { to: '/matrix', label: '色谱 · 矩阵', end: false },
  { to: '/lab', label: '合色 · 实验室', end: false },
];

export function Layout({ children }: { children: ReactNode }) {
  const {
    theme,
    toggleTheme,
    ambientHex,
    selectedColorId,
    setSelectedColorId,
    setAmbientHex,
    favorites,
    setDrawerOpen,
    toast,
    showToast,
  } = useGallery();

  const navigate = useNavigate();
  const location = useLocation();

  const handlePickRandom = () => {
    const pool = COLORS.filter((c) => c.id !== selectedColorId);
    const picked = pool[Math.floor(Math.random() * pool.length)] ?? COLORS[0];
    setSelectedColorId(picked.id);
    setAmbientHex(picked.hex);
    if (location.pathname.startsWith('/color/')) {
      navigate(`/color/${picked.id}`);
    } else if (location.pathname !== '/') {
      navigate('/');
    }
    showToast(`已为你拾取「${picked.name}」`, picked.hex);
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* 极柔和氛围光晕（仅 3%–6% 透明度，绝不刺眼） */}
      <div className="ambient-aura" />

      {/* 极简美术馆顶栏导航 */}
      <header
        className="sticky top-0 z-40 hairline-b backdrop-blur-md"
        style={{ backgroundColor: 'var(--header-bg)' }}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* 品牌标识 */}
            <Link to="/" className="flex items-center gap-3 text-left group shrink-0">
              <span
                className="w-3.5 h-3.5 rounded-full transition-colors duration-500 ring-4 ring-black/[0.04]"
                style={{ backgroundColor: ambientHex }}
              />
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif text-base sm:text-lg font-semibold tracking-wide text-main">
                  中国传统色谱
                </span>
                <span className="hidden lg:inline text-[11px] font-mono tracking-[0.14em] uppercase text-faint">
                  Craft &amp; Chromatics
                </span>
              </div>
            </Link>

            {/* 中央三大视图导航 */}
            <nav
              className="flex items-center gap-1 p-1 rounded-full hairline-all"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
              aria-label="主导航"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all whitespace-nowrap ${
                      isActive ? 'text-main' : 'text-muted hover:text-main'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          backgroundColor: 'var(--bg-surface)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        }
                      : undefined
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* 右侧极简工具：拾色 + 收藏/导出 + 明暗展馆切换 */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePickRandom}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted hover:text-main hairline-all transition hover:bg-black/[0.03] cursor-pointer"
                title="随机鉴赏一种传统色"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>拾色</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted hover:text-main hairline-all transition hover:bg-black/[0.03] cursor-pointer"
                title="收藏夹与设计资产导出"
              >
                <Bookmark
                  className="w-3.5 h-3.5"
                  strokeWidth={1.8}
                  fill={favorites.length > 0 ? 'currentColor' : 'none'}
                />
                <span className="hidden md:inline">收藏 · 导出</span>
                {favorites.length > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums leading-none"
                    style={{
                      backgroundColor: 'var(--text-primary)',
                      color: 'var(--bg-surface)',
                    }}
                  >
                    {favorites.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted hover:text-main hairline-all transition hover:bg-black/[0.03] cursor-pointer"
                title="切换明 / 暗展馆模式"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span className="hidden sm:inline">暗馆</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span className="hidden sm:inline">明馆</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容容器 */}
      <div className="relative z-10 flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        {children}
      </div>

      {/* 极简美术馆底部说明 */}
      <footer className="relative z-10 mt-14 hairline-t py-8">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-faint">
          <div className="font-serif tracking-wide">
            中国传统色谱 · 制色工艺志（共收录 {PROVENANCE_COUNTS.total} 色 · {PROVENANCE_COUNTS.verified}{' '}
            典籍确证 / {PROVENANCE_COUNTS.inferred} 工艺推演 / {PROVENANCE_COUNTS.literary} 文献意象）
          </div>
          <div className="font-mono text-[11px]">
            考据来源：《天工开物》《齐民要术》《考工记》《本草纲目》《芥子园画传》
          </div>
        </div>
      </footer>

      {/* 收藏夹与多格式设计资产导出抽屉 */}
      <CollectionDrawer />

      {/* 柔和极简 Toast 提示 */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div
          className="px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-medium shadow-lg flex items-center gap-2 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-surface)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: toast.dotColor }}
          />
          <span>{toast.message}</span>
        </div>
      </div>
    </div>
  );
}
