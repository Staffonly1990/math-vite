export const styles = {
  root: 'l2-panel flex w-full max-w-md flex-col items-center gap-2 px-4 py-3',
  title: 'font-display text-lg font-bold text-accent',
  hint: 'text-center text-[11px] leading-snug text-muted',
  chests: 'flex flex-wrap justify-center gap-2',
  chest:
    'l2-button px-3 py-2 font-display text-sm font-semibold text-text transition-[filter] select-none touch-manipulation hover:brightness-125',
  skip:
    'l2-button px-4 py-1.5 text-xs font-medium text-muted transition-[filter] select-none touch-manipulation hover:brightness-110',
} as const;
