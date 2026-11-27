import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Check, Code2, Copy, Download, Trash2, X } from 'lucide-react';
import { COLORS, FAMILY_LABELS } from '../data/catalog';
import { useGallery } from '../context/GalleryContext';
import {
  downloadTextFile,
  generateExportContent,
  type ExportFormat,
} from '../utils/exportTokens';

type DrawerTab = 'favorites' | 'export';
type ExportScope = 'favorites' | 'all';

const FORMAT_OPTIONS: Array<{ id: ExportFormat; label: string; desc: string }> = [
  { id: 'css', label: 'CSS Variables', desc: ':root 自定义属性' },
  { id: 'tailwind-v4', label: 'Tailwind v4', desc: '@theme 色板变量' },
  { id: 'tailwind-v3', label: 'Tailwind v3', desc: 'tailwind.config.js' },
  { id: 'figma-json', label: 'Figma Tokens', desc: 'W3C JSON 标准' },
];

export function CollectionDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    favorites,
    toggleFavorite,
    clearFavorites,
    copyText,
    showToast,
  } = useGallery();

  const [tab, setTab] = useState<DrawerTab>('favorites');
  const [scope, setScope] = useState<ExportScope>('favorites');
  const [format, setFormat] = useState<ExportFormat>('css');
  const [justCopied, setJustCopied] = useState(false);

  const favoriteColors = useMemo(
    () =>
      favorites
        .map((id) => COLORS.find((c) => c.id === id))
        .filter((c): c is (typeof COLORS)[number] => Boolean(c)),
    [favorites],
  );

  const effectiveScope: ExportScope =
    scope === 'favorites' && favoriteColors.length === 0 ? 'all' : scope;

  const targetColors = effectiveScope === 'favorites' ? favoriteColors : COLORS;

  const exported = useMemo(
    () => generateExportContent(format, targetColors),
    [format, targetColors],
  );

  if (!drawerOpen) return null;

  const handleCopyCode = () => {
    copyText(exported.code, `${FORMAT_OPTIONS.find((f) => f.id === format)?.label ?? '资产'}`);
    setJustCopied(true);
    window.setTimeout(() => setJustCopied(false), 1800);
  };

  const handleDownload = () => {
    downloadTextFile(exported.code, exported.filename, exported.mimeType);
    showToast(`已导出 ${exported.filename}（共 ${targetColors.length} 色）`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 柔和遮罩 */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      {/* 右侧美术馆策展抽屉（适配移动端 100dvh 与全宽显示） */}
      <aside
        className="relative z-10 w-full sm:max-w-lg h-[100dvh] flex flex-col shadow-2xl hairline-l"
        style={{ backgroundColor: 'var(--bg-canvas)' }}
        aria-label="收藏夹与设计资产导出"
      >
        {/* 顶栏 */}
        <div
          className="px-6 py-4 hairline-b flex items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-faint">
              CURATED COLLECTION &amp; TOKENS
            </div>
            <h2 className="font-serif text-lg font-semibold text-main">色志收藏夹与设计资产</h2>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-full text-muted hover:text-main surface-subtle transition cursor-pointer"
            aria-label="关闭抽屉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="px-6 pt-4">
          <div
            className="grid grid-cols-2 p-1 rounded-xl hairline-all"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <button
              type="button"
              onClick={() => setTab('favorites')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                tab === 'favorites' ? 'text-main' : 'text-muted hover:text-main'
              }`}
              style={
                tab === 'favorites'
                  ? {
                      backgroundColor: 'var(--bg-surface)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }
                  : undefined
              }
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>我的收藏 ({favoriteColors.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('export')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                tab === 'export' ? 'text-main' : 'text-muted hover:text-main'
              }`}
              style={
                tab === 'export'
                  ? {
                      backgroundColor: 'var(--bg-surface)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }
                  : undefined
              }
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>导出设计资产</span>
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto thin-scroll px-6 py-5">
          {tab === 'favorites' ? (
            favoriteColors.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="w-12 h-12 rounded-2xl surface-card flex items-center justify-center text-faint">
                  <Bookmark className="w-5 h-5" strokeWidth={1.6} />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <div className="font-serif text-base font-semibold text-main">
                    尚未收藏任何传统色
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    在鉴赏页、色谱矩阵或单色档案中点击收藏图标，即可建立专属配色本并一键导出为 CSS、Tailwind 或 Figma Tokens。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScope('all');
                    setTab('export');
                  }}
                  className="px-4 py-2 rounded-full text-xs font-medium surface-card hover:border-current/25 transition cursor-pointer"
                >
                  直接导出全部 {COLORS.length} 种传统色 →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">已保存在本地浏览器（LocalStorage）</span>
                  <button
                    type="button"
                    onClick={clearFavorites}
                    className="inline-flex items-center gap-1 text-faint hover:text-main transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清空</span>
                  </button>
                </div>

                {/* 色带预览条 */}
                <div className="h-10 rounded-xl overflow-hidden flex hairline-all">
                  {favoriteColors.map((c) => (
                    <div
                      key={c.id}
                      className="flex-1 h-full"
                      style={{ backgroundColor: c.hex }}
                      title={`${c.name} ${c.hex}`}
                    />
                  ))}
                </div>

                {/* 收藏色卡列表 */}
                <div className="space-y-2">
                  {favoriteColors.map((c) => (
                    <div
                      key={c.id}
                      className="surface-card rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <Link
                        to={`/color/${c.id}`}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 min-w-0 flex-1 group"
                      >
                        <span
                          className="w-9 h-9 rounded-lg shrink-0 shadow-inner"
                          style={{
                            backgroundColor: c.hex,
                            border: '1px solid rgba(128,128,128,0.18)',
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif text-sm font-semibold text-main group-hover:underline underline-offset-4">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-faint truncate">{c.pinyin}</span>
                          </div>
                          <div className="text-[11px] font-mono text-muted tabular-nums">
                            {c.hex} · {FAMILY_LABELS[c.family]}系
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyText(c.hex, `${c.name} HEX`, c.hex)}
                          className="p-1.5 rounded-lg text-faint hover:text-main surface-subtle transition cursor-pointer"
                          title="复制 HEX"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(c.id, c.name, c.hex)}
                          className="p-1.5 rounded-lg text-faint hover:text-main surface-subtle transition cursor-pointer"
                          title="移出收藏"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setScope('favorites');
                    setTab('export');
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-medium transition cursor-pointer"
                  style={{
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--bg-surface)',
                  }}
                >
                  导出这 {favoriteColors.length} 种收藏色为设计 Tokens →
                </button>
              </div>
            )
          ) : (
            <div className="space-y-5">
              {/* 导出范围 */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-faint">
                  01 · 导出范围
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={favoriteColors.length === 0}
                    onClick={() => setScope('favorites')}
                    className={`p-3 rounded-xl text-left transition ${
                      favoriteColors.length === 0
                        ? 'opacity-45 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                    style={
                      effectiveScope === 'favorites'
                        ? {
                            backgroundColor: 'var(--bg-surface)',
                            border: '1.5px solid var(--text-primary)',
                          }
                        : {
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-hairline)',
                          }
                    }
                  >
                    <div className="text-xs font-semibold text-main">我的收藏夹</div>
                    <div className="text-[11px] font-mono text-faint mt-0.5 tabular-nums">
                      {favoriteColors.length} 种传统色
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('all')}
                    className="p-3 rounded-xl text-left transition cursor-pointer"
                    style={
                      effectiveScope === 'all'
                        ? {
                            backgroundColor: 'var(--bg-surface)',
                            border: '1.5px solid var(--text-primary)',
                          }
                        : {
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-hairline)',
                          }
                    }
                  >
                    <div className="text-xs font-semibold text-main">全部已收录色谱</div>
                    <div className="text-[11px] font-mono text-faint mt-0.5 tabular-nums">
                      {COLORS.length} 种传统色
                    </div>
                  </button>
                </div>
              </div>

              {/* 导出格式 */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-faint">
                  02 · 目标格式
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map((opt) => {
                    const active = format === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormat(opt.id)}
                        className="p-3 rounded-xl text-left transition cursor-pointer"
                        style={
                          active
                            ? {
                                backgroundColor: 'var(--bg-surface)',
                                border: '1.5px solid var(--text-primary)',
                              }
                            : {
                                backgroundColor: 'var(--bg-subtle)',
                                border: '1px solid var(--border-hairline)',
                              }
                        }
                      >
                        <div className="text-xs font-semibold text-main">{opt.label}</div>
                        <div className="text-[11px] text-faint mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 代码预览 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-faint">
                    03 · 实时预览 ({exported.filename})
                  </span>
                  <span className="text-[11px] font-mono text-faint tabular-nums">
                    {targetColors.length} TOKENS
                  </span>
                </div>
                <pre
                  className="p-4 rounded-xl text-[11px] font-mono leading-relaxed overflow-auto max-h-72 thin-scroll hairline-all text-main"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <code>{exported.code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 抽屉底部导出操作栏 */}
        {tab === 'export' && (
          <div
            className="px-6 py-4 hairline-t flex items-center gap-2.5"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium hairline-all text-main hover:bg-black/[0.03] transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {justCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{justCopied ? '已复制到剪贴板' : '复制代码'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-surface)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载文件</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
