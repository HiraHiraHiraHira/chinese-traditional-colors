// 在 Figma 中安装免费插件 "Scripter"，框选所有色卡图层后运行此脚本
const results = [];
const rgbToHex = ({ r, g, b }) =>
  '#' + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

function walk(node) {
  if ('fills' in node && Array.isArray(node.fills) && node.fills[0]?.type === 'SOLID') {
    const hex = rgbToHex(node.fills[0].color);
    const name = node.name.trim();
    if (name && hex !== '#FFFFFF' && hex !== '#000000') {
      results.push({ name, hex });
    }
  }
  if ('children' in node) node.children.forEach(walk);
}

figma.currentPage.selection.forEach(walk);
console.log(JSON.stringify(results, null, 2));
