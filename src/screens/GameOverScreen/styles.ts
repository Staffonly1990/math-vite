export const styles = {
  root: 'flex flex-col items-center gap-8 py-14',
  title: 'text-sm font-semibold tracking-widest text-danger uppercase',
  adenValue: 'font-display text-7xl font-black tabular-nums text-accent',
  adenLabel: 'mt-1 text-muted',
  statsGrid: 'grid w-full max-w-md grid-cols-3 gap-3',
  difficultyNote: 'text-xs text-muted',
  actions: 'flex gap-3',
  restartButton:
    'rounded-2xl bg-linear-to-r from-accent-strong to-accent px-8 py-3.5 font-display font-bold text-on-accent transition-shadow hover:shadow-[0_0_40px_rgba(249,93,29,0.35)]',
  menuButton: 'rounded-2xl border border-line bg-surface-2 px-8 py-3.5 font-semibold text-muted transition-colors hover:text-text',
} as const;
