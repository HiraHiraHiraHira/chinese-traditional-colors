import type { TraditionalColor } from '../../data/schema';

export type ExportFormat = 'css' | 'tailwind-v4' | 'tailwind-v3' | 'figma-json';

export function generateCssVariables(colors: TraditionalColor[]): string {
  const lines = [
    '/* 中国传统色谱 · 制色工艺志 — CSS Variables */',
    `:root {`,
    ...colors.map(
      (c) =>
        `  --color-${c.id}: ${c.hex}; /* ${c.name} (${c.pinyin}) · RGB(${c.rgb.join(', ')}) */`,
    ),
    `}`,
  ];
  return lines.join('\n');
}

export function generateTailwindV4Theme(colors: TraditionalColor[]): string {
  const lines = [
    '/* 中国传统色谱 · 制色工艺志 — Tailwind CSS v4 @theme */',
    '@theme {',
    ...colors.map((c) => `  --color-ctc-${c.id}: ${c.hex}; /* ${c.name} */`),
    '}',
  ];
  return lines.join('\n');
}

export function generateTailwindV3Config(colors: TraditionalColor[]): string {
  const entries = colors.map(
    (c) => `          '${c.id}': '${c.hex}', // ${c.name} (${c.pinyin})`,
  );
  return [
    '// 中国传统色谱 · 制色工艺志 — Tailwind Config (v3)',
    'export default {',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    '        chinese: {',
    ...entries,
    '        },',
    '      },',
    '    },',
    '  },',
    '};',
  ].join('\n');
}

export function generateFigmaTokensJson(colors: TraditionalColor[]): string {
  const grouped: Record<
    string,
    Record<
      string,
      {
        $value: string;
        $type: 'color';
        $description: string;
      }
    >
  > = {};

  for (const c of colors) {
    if (!grouped[c.family]) grouped[c.family] = {};
    grouped[c.family][c.id] = {
      $value: c.hex,
      $type: 'color',
      $description: `${c.name} (${c.pinyin})${c.englishName ? ` · ${c.englishName}` : ''}`,
    };
  }

  return JSON.stringify(
    {
      chineseTraditionalColors: grouped,
    },
    null,
    2,
  );
}

export function generateExportContent(format: ExportFormat, colors: TraditionalColor[]): {
  code: string;
  filename: string;
  mimeType: string;
} {
  switch (format) {
    case 'css':
      return {
        code: generateCssVariables(colors),
        filename: 'chinese-traditional-colors.css',
        mimeType: 'text/css;charset=utf-8',
      };
    case 'tailwind-v4':
      return {
        code: generateTailwindV4Theme(colors),
        filename: 'chinese-colors-theme.css',
        mimeType: 'text/css;charset=utf-8',
      };
    case 'tailwind-v3':
      return {
        code: generateTailwindV3Config(colors),
        filename: 'tailwind.chinese-colors.config.js',
        mimeType: 'text/javascript;charset=utf-8',
      };
    case 'figma-json':
      return {
        code: generateFigmaTokensJson(colors),
        filename: 'chinese-traditional-colors.tokens.json',
        mimeType: 'application/json;charset=utf-8',
      };
  }
}

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
