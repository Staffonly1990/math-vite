/**
 * Огорки на фоне меню (тронный зал L2, кадр 1245x920 — кроп,
 * центрированный по ковру: смещение от оригинала x − 228).
 * Координаты источников света — из vision-анализа исходной картинки,
 * пересчитаны в доли нового кадра; маппинг на экран повторяет background-size: cover.
 */

const IMAGE_W = 1245;
const IMAGE_H = 920;
const CROP_OFFSET_X = 228;

interface LightPoint {
  x: number;
  y: number;
}

/** шесть настенных факелов (два ряда по три); оригинальные x: 545/655/708/975/1028/1137 */
const TORCHES: readonly LightPoint[] = [
  { x: (545 - CROP_OFFSET_X) / IMAGE_W, y: 272 / IMAGE_H },
  { x: (655 - CROP_OFFSET_X) / IMAGE_W, y: 272 / IMAGE_H },
  { x: (708 - CROP_OFFSET_X) / IMAGE_W, y: 272 / IMAGE_H },
  { x: (975 - CROP_OFFSET_X) / IMAGE_W, y: 272 / IMAGE_H },
  { x: (1028 - CROP_OFFSET_X) / IMAGE_W, y: 272 / IMAGE_H },
  { x: (1137 - CROP_OFFSET_X) / IMAGE_W, y: 272 / IMAGE_H },
];

/** подвесные лампы у потолка, бирюзовое свечение */
const LAMPS: readonly LightPoint[] = [
  { x: (760 - CROP_OFFSET_X) / IMAGE_W, y: 95 / IMAGE_H },
  { x: (860 - CROP_OFFSET_X) / IMAGE_W, y: 130 / IMAGE_H },
  { x: (930 - CROP_OFFSET_X) / IMAGE_W, y: 130 / IMAGE_H },
];

/** зелёное свечение тронного задника */
const THRONE: LightPoint = { x: (845 - CROP_OFFSET_X) / IMAGE_W, y: 275 / IMAGE_H };

export function drawFires(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void {
  ctx.clearRect(0, 0, width, height);

  // маппинг как у background-size: cover + center
  const scale = Math.max(width / IMAGE_W, height / IMAGE_H);
  const dw = IMAGE_W * scale;
  const dh = IMAGE_H * scale;
  const ox = (width - dw) / 2;
  const oy = (height - dh) / 2;
  const px = (p: LightPoint) => ox + p.x * dw;
  const py = (p: LightPoint) => oy + p.y * dh;

  drawThroneGlow(ctx, px(THRONE), py(THRONE), scale, time);
  for (let i = 0; i < LAMPS.length; i++) {
    drawLampGlow(ctx, px(LAMPS[i]), py(LAMPS[i]), scale, time + i * 2.1);
  }
  for (let i = 0; i < TORCHES.length; i++) {
    drawTorchFlame(ctx, px(TORCHES[i]), py(TORCHES[i]), scale, time + i * 1.3);
  }
}

function drawTorchFlame(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number): void {
  const flicker = Math.sin(time * 9) * 0.5 + Math.sin(time * 23) * 0.3;
  const flameH = 20 * scale * (1 + 0.22 * flicker);
  const flameW = 7 * scale * (1 + 0.12 * Math.sin(time * 17));

  // тёплое свечение вокруг факела
  const glow = ctx.createRadialGradient(x, y - flameH * 0.3, 0, x, y - flameH * 0.3, 42 * scale);
  glow.addColorStop(0, 'rgba(255, 138, 61, 0.35)');
  glow.addColorStop(1, 'rgba(255, 138, 61, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 42 * scale, y - 42 * scale - flameH, 84 * scale, 84 * scale + flameH);

  // три слоя пламени
  const layer = (scaleFactor: number, color: string, wobble: number) => {
    const fx = x + wobble * Math.sin(time * 13);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fx - flameW * scaleFactor, y);
    ctx.quadraticCurveTo(fx - flameW * scaleFactor * 0.6, y - flameH * scaleFactor * 0.6, fx, y - flameH * scaleFactor);
    ctx.quadraticCurveTo(fx + flameW * scaleFactor * 0.6, y - flameH * scaleFactor * 0.6, fx + flameW * scaleFactor, y);
    ctx.closePath();
    ctx.fill();
  };
  layer(1, 'rgba(249, 93, 29, 0.85)', 1.2);
  layer(0.7, 'rgba(255, 138, 61, 0.9)', -0.9);
  layer(0.4, 'rgba(255, 224, 176, 0.95)', 0.7);
}

function drawLampGlow(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number): void {
  const pulse = 0.6 + 0.4 * Math.sin(time * 1.3);
  const radius = 26 * scale;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(96, 200, 190, ${0.3 * pulse})`);
  glow.addColorStop(1, 'rgba(96, 200, 190, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawThroneGlow(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number): void {
  const pulse = 0.6 + 0.4 * Math.sin(time * 0.7);
  const rx = 95 * scale;
  const ry = 160 * scale;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, rx);
  glow.addColorStop(0, `rgba(78, 143, 90, ${0.16 * pulse})`);
  glow.addColorStop(1, 'rgba(78, 143, 90, 0)');
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-x, -y);
  ctx.fillStyle = glow;
  ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
  ctx.restore();
}
