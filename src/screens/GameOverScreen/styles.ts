export const styles = {
  root: 'relative z-10 flex flex-col items-center gap-8 py-14',
  title: 'text-sm font-semibold tracking-widest text-danger uppercase',
  adenValue: 'font-display text-7xl font-black tabular-nums text-accent',
  adenLabel: 'mt-1 text-muted',
  statsGrid: 'grid w-full max-w-md grid-cols-3 gap-3',
  difficultyNote: 'text-xs text-muted',
  actions: 'flex gap-3',
  restartButton:
    'l2-button-lg font-display font-bold text-text transition-[filter] select-none touch-manipulation hover:brightness-125',
  menuButton:
    'l2-button font-semibold text-muted transition-[filter] select-none touch-manipulation hover:brightness-110 hover:text-text',
} as const;
