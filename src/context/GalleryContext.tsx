import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  COLORS,
  type CraftFilter,
  type FamilyFilter,
  type ProvenanceFilter,
} from '../data/catalog';
import { copyToClipboard, hexToRgb } from '../utils/color';

export type ThemeMode = 'light' | 'dark';

interface ToastState {
  visible: boolean;
  message: string;
  dotColor: string;
}

interface GalleryContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  ambientHex: string;
  setAmbientHex: (hex: string) => void;
  selectedColorId: string;
  setSelectedColorId: (id: string) => void;
  search: string;
  setSearch: (q: string) => void;
  family: FamilyFilter;
  setFamily: (f: FamilyFilter) => void;
  craft: CraftFilter;
  setCraft: (c: CraftFilter) => void;
  provenance: ProvenanceFilter;
  setProvenance: (p: ProvenanceFilter) => void;
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string, colorName?: string, hex?: string) => void;
  clearFavorites: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toast: ToastState;
  showToast: (message: string, dotColor?: string) => void;
  copyText: (text: string, label: string, swatchHex?: string) => void;
}

const THEME_STORAGE_KEY = 'ctc-theme-v1';
const FAVORITES_STORAGE_KEY = 'ctc-favorites-v1';

const GalleryContext = createContext<GalleryContextValue | null>(null);

function loadInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // ignore storage errors
  }
  return 'light';
}

function loadInitialFavorites(): string[] {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      const validIds = new Set(COLORS.map((c) => c.id));
      return parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id));
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);
  const [ambientHex, setAmbientHex] = useState<string>(COLORS[0]?.hex ?? '#C02C38');
  const [selectedColorId, setSelectedColorId] = useState<string>(COLORS[0]?.id ?? 'zhusha');
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState<FamilyFilter>('all');
  const [craft, setCraft] = useState<CraftFilter>('all');
  const [provenance, setProvenance] = useState<ProvenanceFilter>('all');
  const [favorites, setFavorites] = useState<string[]>(loadInitialFavorites);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    dotColor: '#34D399',
  });

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, dotColor = '#34D399') => {
    setToast({ visible: true, message, dotColor });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2200);
  }, []);

  const copyText = useCallback(
    async (text: string, label: string, swatchHex?: string) => {
      const ok = await copyToClipboard(text);
      showToast(ok ? `已复制 ${label}：${text}` : `请手动复制：${text}`, swatchHex ?? '#34D399');
    },
    [showToast],
  );

  // Sync theme attribute & localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync restrained 3%-6% ambient aura CSS token
  useEffect(() => {
    const { r, g, b } = hexToRgb(ambientHex);
    const alpha = theme === 'dark' ? 0.06 : 0.045;
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, ${alpha})`);
  }, [ambientHex, theme]);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback(
    (id: string, colorName?: string, hex?: string) => {
      setFavorites((prev) => {
        const exists = prev.includes(id);
        const next = exists ? prev.filter((item) => item !== id) : [id, ...prev];
        if (colorName) {
          showToast(exists ? `已移出收藏：「${colorName}」` : `已收藏传统色：「${colorName}」`, hex);
        }
        return next;
      });
    },
    [showToast],
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    showToast('已清空色志收藏夹');
  }, [showToast]);

  const value = useMemo<GalleryContextValue>(
    () => ({
      theme,
      toggleTheme,
      ambientHex,
      setAmbientHex,
      selectedColorId,
      setSelectedColorId,
      search,
      setSearch,
      family,
      setFamily,
      craft,
      setCraft,
      provenance,
      setProvenance,
      favorites,
      isFavorite,
      toggleFavorite,
      clearFavorites,
      drawerOpen,
      setDrawerOpen,
      toast,
      showToast,
      copyText,
    }),
    [
      theme,
      toggleTheme,
      ambientHex,
      selectedColorId,
      search,
      family,
      craft,
      provenance,
      favorites,
      isFavorite,
      toggleFavorite,
      clearFavorites,
      drawerOpen,
      toast,
      showToast,
      copyText,
    ],
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider');
  return ctx;
}
