export const styles = {
  /**
   * Оверлей прозрачен для кликов: игра под модалкой продолжает работать,
   * время (будущие таймеры) не останавливается — это правило фичи «сдаться».
   */
  overlay: 'pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4',
  card: 'glass-panel pointer-events-auto w-full max-w-sm p-6 [box-shadow:0_20px_60px_rgba(0,0,0,0.6)]',
  title: 'font-display text-2xl font-bold text-danger',
  body: 'mt-3 text-sm leading-relaxed text-muted',
  actions: 'mt-5 flex flex-col gap-2',
  stay: 'glass-button glass-button--accent px-4 py-2 text-sm font-semibold select-none touch-manipulation',
  escape: 'glass-button px-4 py-2 text-sm font-medium text-muted select-none touch-manipulation',
} as const;
