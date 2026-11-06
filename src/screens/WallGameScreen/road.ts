/**
 * Геометрия FPV-дороги: перспективная проекция 4-полосной дороги.
 * viewBox 480×270, горизонт сверху, игрок снизу.
 */

export const VIEW_W = 480;
export const VIEW_H = 270;
export const HORIZON_Y = 65;
export const PLAYER_Y = 235;

/** Ширина дороги на горизонте и у игрока */
const ROAD_LEFT_HORIZON = 140;
const ROAD_RIGHT_HORIZON = 340;
const ROAD_LEFT_PLAYER = 20;
const ROAD_RIGHT_PLAYER = 460;

/** Левый край дороги на высоте y */
export function roadLeft(y: number): number {
  const t = Math.max(0, Math.min(1, (y - HORIZON_Y) / (PLAYER_Y - HORIZON_Y)));
  return ROAD_LEFT_HORIZON + (ROAD_LEFT_PLAYER - ROAD_LEFT_HORIZON) * t;
}

/** Правый край дороги на высоте y */
export function roadRight(y: number): number {
  const t = Math.max(0, Math.min(1, (y - HORIZON_Y) / (PLAYER_Y - HORIZON_Y)));
  return ROAD_RIGHT_HORIZON + (ROAD_RIGHT_PLAYER - ROAD_RIGHT_HORIZON) * t;
}

/** Ширина дороги на высоте y */
export function roadWidth(y: number): number {
  return roadRight(y) - roadLeft(y);
}

/** Y-позиция стены по дистанции (0=игрок, 1=горизонт) */
export function wallY(distance: number): number {
  const d = Math.max(0, Math.min(1, distance));
  return PLAYER_Y + (HORIZON_Y - PLAYER_Y) * d;
}

/** Высота стены по дистанции (далеко — тонкая, близко — толстая) */
export function wallHeight(distance: number): number {
  const d = Math.max(0, Math.min(1, distance));
  return 8 + 52 * (1 - d);
}

/** Высота шапки (примера) по дистанции */
export function headerHeight(distance: number): number {
  const d = Math.max(0, Math.min(1, distance));
  return 6 + 16 * (1 - d);
}

export interface WallGeometry {
  /** верх стены (дальняя часть, уже) */
  topY: number;
  /** низ стены (ближняя часть, шире) */
  bottomY: number;
  /** шапка (ещё выше) */
  headerY: number;
  headerH: number;
  /** края дороги на уровне верха/низа */
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
  /** ширина ячейки на верху/низу */
  cellTopW: number;
  cellBottomW: number;
  /** общий масштаб для шрифта */
  fontScale: number;
}

export function wallGeometry(distance: number): WallGeometry {
  const h = wallHeight(distance);
  const cy = wallY(distance);
  const topY = cy - h / 2;
  const bottomY = cy + h / 2;
  const hh = headerHeight(distance);
  const headerY = topY - hh;

  const topLeft = roadLeft(topY);
  const topRight = roadRight(topY);
  const bottomLeft = roadLeft(bottomY);
  const bottomRight = roadRight(bottomY);

  return {
    topY, bottomY, headerY, headerH: hh,
    topLeft, topRight, bottomLeft, bottomRight,
    cellTopW: (topRight - topLeft) / 4,
    cellBottomW: (bottomRight - bottomLeft) / 4,
    fontScale: 1 - distance * 0.7,
  };
}

/** Трапеция ячейки i (0..3) */
export function cellPolygon(geo: WallGeometry, i: number): string {
  const x1 = geo.topLeft + geo.cellTopW * i;
  const x2 = geo.topLeft + geo.cellTopW * (i + 1);
  const x3 = geo.bottomLeft + geo.cellBottomW * (i + 1);
  const x4 = geo.bottomLeft + geo.cellBottomW * i;
  return `${x1},${geo.topY} ${x2},${geo.topY} ${x3},${geo.bottomY} ${x4},${geo.bottomY}`;
}
