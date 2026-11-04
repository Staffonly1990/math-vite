/**
 * Разбор скриншота L2 (экран выбора персонажа, 1680x1050) на ассеты:
 *  - вырезаем кнопки и панель (стиль для нашего UI);
 *  - фон: кроп 1245x920, ЦЕНТРИРОВАННЫЙ ПО КОВРУ (центр ковра x≈850,
 *    измерен по красным пикселям). Зоны UI за кадром:
 *      справа-снизу стек (x 1548..1680) — кроп до x = 1473;
 *      снизу-центр кнопка (y 924..992)  — кроп до y = 920;
 *      слева-сверху панель (x 4..299)   — в кадр попадает краешек
 *        (x 228..299) — закрываем копией соседней тёмной стены, без блюра.
 */
import { Jimp } from 'jimp';

const SRC = 'public/assets/images/source/menu.jpg';
const OUT = 'public/assets/images';

async function crop(src, x, y, w, h, out) {
  const part = src.clone().crop({ x, y, w, h });
  await part.write(`${OUT}/${out}`);
  console.log(`ok ${out} (${w}x${h})`);
}

const img = await Jimp.read(SRC);

// ассеты стиля (из оригинала)
await crop(img, 772, 936, 139, 44, 'button-start.png');  // «Начать игру»
await crop(img, 1556, 870, 114, 36, 'button-small.png'); // «Создать»
await crop(img, 14, 10, 269, 114, 'panel-frame.png');    // панель персонажа

// фон, центрированный по ковру
const CROP_X = 228;
const bg = img.clone().crop({ x: CROP_X, y: 0, w: 1245, h: 920 });

// краешек панели персонажа в левом верхнем углу → копия соседней стены (без блюра)
const wallPatch = bg.clone().crop({ x: 80, y: 0, w: 74, h: 140 });
bg.composite(wallPatch, 0, 0);

await bg.write(`${OUT}/menu-bg.jpg`, { quality: 90 });
console.log('ok menu-bg.jpg (1245x920, ковёр по центру)');
