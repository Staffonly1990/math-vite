export const styles = {
  /**
   * Оверлей прозрачен для кликов: игра под модалкой продолжает работать,
   * время (будущие таймеры) не останавливается — это правило фичи «сдаться».
   */
  overlay: 'pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4',
  card: 'pointer-events-auto w-full max-w-sm rounded-2xl border border-line bg-surface/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]',
  title: 'font-display text-2xl font-bold text-danger',
  body: 'mt-3 text-sm leading-relaxed text-muted',
  actions: 'mt-5 flex flex-col gap-2',
  stay:
    'rounded-xl border border-accent/60 bg-accent/15 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/25 select-none touch-manipulation',
  escape:
    'rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-text select-none touch-manipulation',
} as const;
