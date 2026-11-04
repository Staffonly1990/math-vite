import { useEffect, useRef } from 'react';
import { drawFires } from './fires';
import { styles } from './styles';

/**
 * Фон главного меню: скриншот тронного зала L2 (очищенный от UI-блоков)
 * + канвас с анимированными огнями поверх. Платформенный слой (на RN — нативно).
 */
export function MenuBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reducedMotion) drawFires(ctx, w, h, 4.2);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const frame = (now: number) => {
      drawFires(ctx, canvas.clientWidth, canvas.clientHeight, now / 1000);
      raf = requestAnimationFrame(frame);
    };
    if (!reducedMotion) raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={styles.root}
      style={{ backgroundImage: "url('/assets/images/menu-bg.jpg')" }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
