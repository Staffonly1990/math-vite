/**
 * Уровень = цвет: каждый уровень циклично красит мир своим неоном.
 * Стены, края дороги, полоса прогресса и HUD светятся цветом текущего уровня.
 * Зоны риска — вне цикла: золото = награда (×2), красный = высший риск (×3).
 */

export interface LevelColor {
  /** #rrggbb — для SVG/CSS атрибутов */
  hex: string;
  /** 'r,g,b' — для rgba() с произвольной альфой */
  rgb: string;
}

export const LEVEL_COLORS = [
  '#00d4ff', // 0 — синий
  '#00ffb4', // 1 — бирюза
  '#a4ff00', // 2 — кислотно-зелёный
  '#ffe600', // 3 — жёлтый
  '#ff8800', // 4 — оранжевый
  '#ff4488', // 5 — розовый
  '#aa44ff', // 6 — фиолетовый
] as const;

function toColor(hex: string): LevelColor {
  const rgb = `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
  return { hex, rgb };
}

/** Цвет уровня (циклический, уровень 0 = синий) */
export function levelColor(level: number): LevelColor {
  const idx = Math.max(0, Math.floor(level)) % LEVEL_COLORS.length;
  return toColor(LEVEL_COLORS[idx]);
}

/** Золотая зона ×2 — золото = награда (как бонус-ячейки) */
export const GOLD = toColor('#ffd84a');

/** Красная линия ×3 — высший риск у лица стены */
export const RISK_RED = toColor('#ff4457');

/** rgba цвета с альфой */
export function rgba(color: LevelColor, alpha: number): string {
  return `rgba(${color.rgb},${alpha})`;
}

/** Смешать два цвета: t=0 → a, t=1 → b (для краснеющей линии сгорания) */
export function mix(a: LevelColor, b: LevelColor, t: number): LevelColor {
  const k = Math.max(0, Math.min(1, t));
  const ca = a.rgb.split(',').map(Number);
  const cb = b.rgb.split(',').map(Number);
  const parts = ca.map((v, i) => Math.round(v * (1 - k) + cb[i] * k));
  const hex = `#${parts.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return toColor(hex);
}
