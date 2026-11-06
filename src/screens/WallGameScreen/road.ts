/**
 * Геометрия трассы v3 — ВЕРТИКАЛЬНАЯ (портрет телефона, Guitar Hero-стиль):
 *   стены летят сверху вниз к линии удара; полосы — вертикальные колонки
 *   (2/3/4 с уровнем, ширина трассы дышит, тап-таргет постоянный);
 *   размер стены и чисел постоянен на всём пути — перспектива не сжимает.
 */
export const VIEW_W = 390;
export const VIEW_H = 844;

/** центр стены по дистанции: d=1 — спавн сразу под шапкой (максимум экрана), d=0 — линия сгорания */
export const SPAWN_Y = 130;
/** линия сгорания — тонкая неоновая нить, прижата к шкале заполнения */
export const HIT_Y = 758;

/** высота стены и шапки с примером — постоянные */
export const BAR_H = 100;
export const HEADER_H = 30;
/** ширина полосы (колонки) — постоянный тап-таргет */
export const LANE_W = 82;

/** Центр стены по дистанции (0=удар, 1=спавн) */
export function wallY(distance: number): number {
  const d = Math.max(0, Math.min(1, distance));
  return HIT_Y + (SPAWN_Y - HIT_Y) * d;
}

/** Края трассы при N полосах: ширина = N × LANE_W (+ поля) */
export function roadLeft(lanes: number): number {
  return VIEW_W / 2 - (lanes * LANE_W) / 2 - 8;
}

export function roadRight(lanes: number): number {
  return VIEW_W / 2 + (lanes * LANE_W) / 2 + 8;
}

export interface WallGeometry {
  /** центр горизонтальной стены-гейта */
  centerY: number;
  topY: number;
  bottomY: number;
  /** шапка с примером над стеной */
  headerY: number;
  headerH: number;
  left: number;
  right: number;
  cellW: number;
}

export function wallGeometry(distance: number, lanes: number): WallGeometry {
  const centerY = wallY(distance);
  const left = roadLeft(lanes);
  const right = roadRight(lanes);
  return {
    centerY,
    topY: centerY - BAR_H / 2,
    bottomY: centerY + BAR_H / 2,
    headerY: centerY - BAR_H / 2 - HEADER_H,
    headerH: HEADER_H,
    left,
    right,
    cellW: (right - left) / lanes,
  };
}

/** Прямоугольник ячейки-колонки i (0..lanes−1) внутри стены */
export function cellRect(geo: WallGeometry, i: number): { x: number; y: number; w: number; h: number } {
  return {
    x: geo.left + geo.cellW * i + 3,
    y: geo.topY + 3,
    w: geo.cellW - 6,
    h: BAR_H - 6,
  };
}
