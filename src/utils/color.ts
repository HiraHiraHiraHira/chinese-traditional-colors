import type { TraditionalColor } from '../../data/schema';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface CmykColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface LabColor {
  l: number;
  a: number;
  b: number;
}

export interface WcagResult {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  grade: 'AAA' | 'AA' | 'AA Large' | 'Fail';
}

export function hexToRgb(hex: string): RgbColor {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function rgbToCmyk(r: number, g: number, b: number): CmykColor {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const k = 1 - Math.max(rp, gp, bp);
  return {
    c: Math.round(((1 - rp - k) / (1 - k)) * 100),
    m: Math.round(((1 - gp - k) / (1 - k)) * 100),
    y: Math.round(((1 - bp - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function isLightHex(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.64;
}

/** sRGB -> CIE XYZ (D65) -> CIELAB */
export function rgbToLab(r: number, g: number, b: number): LabColor {
  const toLinear = (v: number) => {
    const n = v / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };

  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);

  // D65 reference illuminant
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175) / 1.0;
  const z = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function hexToLab(hex: string): LabColor {
  const { r, g, b } = hexToRgb(hex);
  return rgbToLab(r, g, b);
}

/** CIEDE2000 perceptual color difference (Delta-E 2000) */
export function deltaE2000(lab1: LabColor, lab2: LabColor): number {
  const degToRad = (d: number) => (d * Math.PI) / 180;
  const radToDeg = (r: number) => (r * 180) / Math.PI;

  const avgLp = (lab1.l + lab2.l) / 2;
  const c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const avgC = (c1 + c2) / 2;

  const g = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = lab1.a * (1 + g);
  const a2p = lab2.a * (1 + g);

  const c1p = Math.sqrt(a1p * a1p + lab1.b * lab1.b);
  const c2p = Math.sqrt(a2p * a2p + lab2.b * lab2.b);
  const avgCp = (c1p + c2p) / 2;

  const h1p = c1p === 0 ? 0 : (radToDeg(Math.atan2(lab1.b, a1p)) + 360) % 360;
  const h2p = c2p === 0 ? 0 : (radToDeg(Math.atan2(lab2.b, a2p)) + 360) % 360;

  const dLp = lab2.l - lab1.l;
  const dCp = c2p - c1p;

  let dhp = 0;
  if (c1p * c2p !== 0) {
    if (Math.abs(h2p - h1p) <= 180) {
      dhp = h2p - h1p;
    } else if (h2p - h1p > 180) {
      dhp = h2p - h1p - 360;
    } else {
      dhp = h2p - h1p + 360;
    }
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(degToRad(dhp / 2));

  let avgHp = h1p + h2p;
  if (c1p * c2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) {
      avgHp = (h1p + h2p) / 2;
    } else if (h1p + h2p < 360) {
      avgHp = (h1p + h2p + 360) / 2;
    } else {
      avgHp = (h1p + h2p - 360) / 2;
    }
  }

  const t =
    1 -
    0.17 * Math.cos(degToRad(avgHp - 30)) +
    0.24 * Math.cos(degToRad(2 * avgHp)) +
    0.32 * Math.cos(degToRad(3 * avgHp + 6)) -
    0.2 * Math.cos(degToRad(4 * avgHp - 63));

  const dTheta = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2));
  const rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const sl = 1 + (0.015 * Math.pow(avgLp - 50, 2)) / Math.sqrt(20 + Math.pow(avgLp - 50, 2));
  const sc = 1 + 0.045 * avgCp;
  const sh = 1 + 0.015 * avgCp * t;
  const rt = -Math.sin(degToRad(2 * dTheta)) * rc;

  return Math.sqrt(
    Math.pow(dLp / sl, 2) +
      Math.pow(dCp / sc, 2) +
      Math.pow(dHp / sh, 2) +
      rt * (dCp / sc) * (dHp / sh),
  );
}

export function findNearestColors(
  targetHex: string,
  catalog: TraditionalColor[],
  limit = 3,
  excludeId?: string,
): Array<{ color: TraditionalColor; deltaE: number }> {
  const targetLab = hexToLab(targetHex);
  return catalog
    .filter((c) => c.id !== excludeId)
    .map((color) => ({
      color,
      deltaE: deltaE2000(targetLab, hexToLab(color.hex)),
    }))
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, limit);
}

export function describeDeltaE(de: number): string {
  if (de < 2) return '近乎无差';
  if (de < 5) return '极度接近';
  if (de < 10) return '同韵近似';
  if (de < 18) return '相近色域';
  return '可作参照';
}

/** WCAG 2.1 Relative Luminance & Contrast Ratio */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const transform = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function evaluateWcag(foregroundHex: string, backgroundHex: string): WcagResult {
  const ratio = getContrastRatio(foregroundHex, backgroundHex);
  const aaLarge = ratio >= 3;
  const aaNormal = ratio >= 4.5;
  const aaaLarge = ratio >= 4.5;
  const aaaNormal = ratio >= 7;

  let grade: WcagResult['grade'] = 'Fail';
  if (aaaNormal) grade = 'AAA';
  else if (aaNormal) grade = 'AA';
  else if (aaLarge) grade = 'AA Large';

  return {
    ratio,
    aaNormal,
    aaLarge,
    aaaNormal,
    aaaLarge,
    grade,
  };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
