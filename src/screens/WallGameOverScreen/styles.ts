export const styles = {
  root: 'flex h-dvh flex-col items-center justify-center gap-6 bg-[#05070d] p-4',
  title: 'text-sm font-semibold tracking-widest text-danger uppercase',
  adenValue: 'font-display text-7xl font-black tabular-nums text-accent',
  adenLabel: 'mt-1 text-muted',
  statsGrid: 'grid w-full max-w-md grid-cols-2 gap-3',
  statRoot: 'l2-panel px-3 py-3 text-center',
  statValue: 'font-display text-2xl font-bold tabular-nums',
  statLabel: 'mt-1 text-xs text-muted',
  actions: 'flex gap-3',
  restartBtn:
    'l2-button-lg font-display font-bold text-text transition-[filter] select-none touch-manipulation hover:brightness-125',
  menuBtn:
    'l2-button font-semibold text-muted transition-[filter] select-none touch-manipulation hover:brightness-110 hover:text-text',
} as const;
