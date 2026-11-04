export const styles = {
  grid: 'grid grid-cols-2 gap-3',
  option:
    'rounded-2xl border px-4 py-5 font-display text-3xl font-semibold tabular-nums select-none touch-manipulation transition-colors',
  optionIdle: 'border-line bg-surface-2 text-text hover:border-accent/60 hover:bg-accent/10',
  optionCorrect: 'border-success bg-success/15 text-success',
  optionWrong: 'border-danger bg-danger/15 text-danger',
} as const;
